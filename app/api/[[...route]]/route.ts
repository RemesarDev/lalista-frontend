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

export const runtime = 'nodejs'; 

const app = new Hono().basePath('/api');

app.onError((err, c) => {
  console.error('[API ERROR]', {
    timestamp: new Date().toISOString(),
    method: c.req.method,
    path: c.req.path,
    status: 500,
    error: err.message,
  });

  insertAnalyticsEvent({
    eventName: 'api_error',
    region: c.req.header('x-vercel-ip-city') || 'Argentina',
    metadata: {
      path: c.req.path,
      method: c.req.method,
      error: err.message,
    }
    }).catch(console.error);


  return c.json(
    { error: 'Error interno del servidor' },
    500
  );
});

// ==========================================
// 1. CAPAS GLOBALES DE SEGURIDAD
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
  .route('/', analyticsRouter);

// ==========================================
// 5. EXPORTACIONES PARA NEXT.JS
// ==========================================
export const GET = handle(app);
export const POST = handle(app);
export const PUT = handle(app);
export const PATCH = handle(app);
export const DELETE = handle(app);
export type AppType = typeof routes;