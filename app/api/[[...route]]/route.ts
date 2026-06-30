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
// Mantiene un registro en memoria de las IPs para limitar el spam.
const rateLimitMap = new Map<string, { count: number; lastReset: number }>();
const MAX_REQUESTS = 50; // Límite de peticiones permitidas...
const WINDOW_MS = 60 * 1000; // ...en esta ventana de tiempo (1 minuto).

app.use('*', async (c, next) => {
  // En Vercel, la IP real del usuario viene en este header:
  const ip = c.req.header('x-forwarded-for') || 'ip-desconocida';
  const now = Date.now();

  const userRecord = rateLimitMap.get(ip);

  if (!userRecord || now - userRecord.lastReset > WINDOW_MS) {
    // Si es la primera vez o ya pasó 1 minuto, reiniciamos su contador a 1
    rateLimitMap.set(ip, { count: 1, lastReset: now });
  } else {
    // Si sigue pidiendo dentro del mismo minuto, sumamos 1
    userRecord.count++;
    
    // Si supera el límite de 50 peticiones, cortamos la conexión de raíz
    if (userRecord.count > MAX_REQUESTS) {
      return c.json({ 
        error: 'Too Many Requests', 
        message: 'Has superado el límite de peticiones. Intenta de nuevo en un minuto.' 
      }, 429);
    }
  }
  
  // Si todo está bien, lo dejamos pasar al siguiente paso
  await next();
});

// ==========================================
// 2. CAPAS GLOBALES DE SEGURIDAD
// ==========================================
app.use('*', secureHeaders());
app.use('*', cors({
  origin: process.env.NODE_ENV === 'production' 
    ? 'https://lalista-frontend.vercel.app' 
    : 'http://localhost:5000',
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
  .route('/', productosRouter)  // Engancha /productos y /catalogo
  .route('/maps', mapsRouter);  // Engancha todos los /maps/*

// ==========================================
// 5. EXPORTACIONES PARA NEXT.JS
// ==========================================
export const GET = handle(app);
export const POST = handle(app);
export const PUT = handle(app);
export const PATCH = handle(app);
export const DELETE = handle(app);
export type AppType = typeof routes;