import { Hono } from 'hono';
import { handle } from 'hono/vercel';
import { cors } from 'hono/cors';
import { secureHeaders } from 'hono/secure-headers';
import { productosRouter } from './productos';
import { mapsRouter } from './maps';
import { auth } from '@/app/_lib/auth';

export const runtime = 'nodejs'; 

const app = new Hono().basePath('/api');

// ==========================================
// 1. ESCUDO ANTI-DDOS (Rate Limiter)
// ==========================================
const rateLimitMap = new Map<string, { count: number; lastReset: number }>();
const MAX_REQUESTS = 50; 
const WINDOW_MS = 60 * 1000; 

app.use('*', async (c, next) => {
  const ip = c.req.header('x-forwarded-for') || 'ip-desconocida';
  const now = Date.now();
  const userRecord = rateLimitMap.get(ip);

  if (!userRecord || now - userRecord.lastReset > WINDOW_MS) {
    rateLimitMap.set(ip, { count: 1, lastReset: now });
  } else {
    userRecord.count++;
    if (userRecord.count > MAX_REQUESTS) {
      return c.json({ 
        error: 'Too Many Requests', 
        message: 'Has superado el límite de peticiones. Intenta de nuevo en un minuto.' 
      }, 429);
    }
  }
  await next();
});

// ==========================================
// 2. CAPAS GLOBALES DE SEGURIDAD (Actualizado)
// ==========================================
app.use('*', secureHeaders());

app.use('*', cors({
  origin: (origin) => {
    // Tomamos tu variable de entorno
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    
    // Permitimos peticiones si vienen de tu URL oficial, o de entornos de Preview en Vercel
    if (!origin || origin === appUrl || /\.vercel\.app$/.test(origin)) {
      return origin || appUrl;
    }
    return appUrl;
  },
  credentials: true, // Vital para que las cookies de sesión pasen
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
  .route('/maps', mapsRouter);  

// ==========================================
// 5. EXPORTACIONES PARA NEXT.JS
// ==========================================
export const GET = handle(app);
export const POST = handle(app);
export const PUT = handle(app);
export const PATCH = handle(app);
export const DELETE = handle(app);
export type AppType = typeof routes;