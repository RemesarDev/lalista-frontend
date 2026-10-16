// app/api/[[...route]]/app.ts
// La app de Hono vive aca y no en route.ts para que los tests la puedan
// importar entera (route.ts solo puede exportar handlers y config de Next).
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { secureHeaders } from 'hono/secure-headers';
import { productosRouter } from './productos';
import { mapsRouter } from './maps';
import { auth } from '@/app/_lib/auth';
import { listasRouter } from './listas';
import { usuariosRouter } from './usuarios';
import { historicoRouter } from './historico';
import { direccionesRouter } from './direcciones';
import { analyticsRouter } from './analytics';
import { insertAnalyticsEvent } from '@/app/_lib/utils/analytics';
import { ratelimit } from '@/app/_lib/rate-limit';
import { adminRouter } from './admin';
import { supportRouter } from './support';
import { promocionesRouter } from './promociones';
import { origenesCors } from '@/app/_lib/origenes';

export const app = new Hono().basePath('/api');

// ==========================================
// MANEJADOR GLOBAL DE ERRORES DE API
// ==========================================
app.onError((err, c) => {
    console.error('[API ERROR]', {
        timestamp: new Date().toISOString(),
        method: c.req.method,
        path: c.req.path,
        status: 500,
        error: err.message,
    });

    // Extracción de ubicación con fallback seguro
    const country = c.req.header('x-vercel-ip-country') || 'AR';
    const rawProvince = c.req.header('x-vercel-ip-country-region');
    const rawCity = c.req.header('x-vercel-ip-city');
    const province = rawProvince ? decodeURIComponent(rawProvince) : null;
    const city = rawCity ? decodeURIComponent(rawCity) : null;
    const fallbackRegion = city || province || country;

    // Registro automático en la Base de Datos 2 de Analíticas
    insertAnalyticsEvent({
        eventName: 'api_error',
        region: fallbackRegion,
        metadata: {
            path: c.req.path,
            method: c.req.method,
            errorType: 'SERVER_INTERNAL_ERROR',
            errorMessage: err.message,
        }
    }).catch(console.error);

    return c.json(
        { error: 'Error interno del servidor' },
        500
    );
});

// ==========================================
// 1. ESCUDO ANTI-DDOS (Rate Limiter — Upstash Redis)
// ==========================================
app.use('*', async (c, next) => {
    const ip =
        c.req.header('x-forwarded-for')?.split(',')[0].trim() ||
        c.req.header('x-real-ip') ||
        'ip-desconocida';

    // Fail-open: si Redis no responde, dejamos pasar el request
    // en lugar de tumbar toda la API con un 500.
    let success = true;
    try {
        ({ success } = await ratelimit.limit(ip));
    } catch (err) {
        console.error('[RATE LIMIT] Redis no disponible, permitiendo request:', err);
    }

    if (!success) {
        insertAnalyticsEvent({
            eventName: 'rate_limit_exceeded',
            region: ip,
            metadata: { ip, path: c.req.path },
        }).catch(console.error);

        return c.json(
            {
                error: 'Too Many Requests',
                message: 'Has superado el límite de peticiones. Intenta de nuevo en un minuto.',
            },
            429
        );
    }

    await next();
});

// ==========================================
// 2. CAPAS GLOBALES DE SEGURIDAD
// ==========================================
app.use('*', secureHeaders());

app.use('*', cors({
    origin: (origin) => {
        const appUrl = (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/$/, '');
        // localhost solo fuera de produccion (hallazgo GK-03).
        const allowedOrigins = origenesCors({
            appUrl,
            nodeEnv: process.env.NODE_ENV,
            vercelUrl: process.env.VERCEL_URL,
            vercelBranchUrl: process.env.VERCEL_BRANCH_URL,
        });

        if (!origin || allowedOrigins.has(origin)) {
            return origin || appUrl;
        }

        return null;
    },
    credentials: true,
}));

// Las respuestas con datos de un usuario no se guardan en ningun cache: ni el
// del navegador, ni proxies intermedios. El service worker tiene su propia
// regla para estas rutas (app/sw.ts), esto cubre todo lo demas.
const RUTAS_PRIVADAS = /^\/api\/(auth|listas|direcciones|usuarios|admin|support)(\/|$)/;
app.use('*', async (c, next) => {
    await next();
    if (!RUTAS_PRIVADAS.test(c.req.path)) return;
    try {
        c.res.headers.set('Cache-Control', 'private, no-store');
    } catch {
        // Algunas respuestas (Response.redirect) traen headers inmutables.
        c.res = new Response(c.res.body, c.res);
        c.res.headers.set('Cache-Control', 'private, no-store');
    }
});

// ==========================================
// 3. AUTENTICACIÓN (Better Auth) 
// ==========================================
app.all('/auth/*', (c) => {
    return auth.handler(c.req.raw);
});

// ==========================================
// 4. ENRUTAMIENTO MODULAR (Chaining)
// ==========================================
export const routes = app
    .route('/', productosRouter)
    .route('/', listasRouter)
    .route('/', usuariosRouter)
    .route('/', direccionesRouter)
    .route('/maps', mapsRouter)
    .route('/', historicoRouter)
    .route('/', analyticsRouter)
    .route('/', adminRouter)
    .route('/', supportRouter)
    .route('/', promocionesRouter);
