import { Hono } from 'hono';
import { handle } from 'hono/vercel';
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

export const runtime = 'nodejs'; 

const app = new Hono().basePath('/api');

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

    const { success } = await ratelimit.limit(ip);

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
        const vercelUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null;
        const vercelBranchUrl = process.env.VERCEL_BRANCH_URL ? `https://${process.env.VERCEL_BRANCH_URL}` : null;

        const allowedOrigins = new Set([
            appUrl,
            'http://localhost:3000',
            'http://127.0.0.1:3000',
            ...(vercelUrl ? [vercelUrl] : []),
            ...(vercelBranchUrl ? [vercelBranchUrl] : []),
        ]);

        if (!origin || allowedOrigins.has(origin)) {
            return origin || appUrl;
        }

        return null;
    },
    credentials: true,
}));

// ==========================================
// 3. AUTENTICACIÓN (Better Auth) 
// ==========================================
app.all('/auth/*', (c) => {
    return auth.handler(c.req.raw);
});

// ==========================================
// 4. ENRUTAMIENTO MODULAR (Chaining)
// ==========================================
const routes = app
    .route('/', productosRouter)
    .route('/', listasRouter)
    .route('/', usuariosRouter)
    .route('/', direccionesRouter)
    .route('/maps', mapsRouter)
    .route('/', historicoRouter)
    .route('/', analyticsRouter)
    .route('/', adminRouter)
    .route('/', supportRouter);

// ==========================================
// 5. EXPORTACIONES PARA NEXT.JS
// ==========================================
export const GET = handle(app);
export const POST = handle(app);
export const PUT = handle(app);
export const PATCH = handle(app);
export const DELETE = handle(app);
export type AppType = typeof routes;
