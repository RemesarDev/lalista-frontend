import { Hono } from 'hono';
import { handle } from 'hono/vercel';
import { cors } from 'hono/cors';
import { secureHeaders } from 'hono/secure-headers';
import { productosRouter } from './productos';
import { mapsRouter } from './maps';

const app = new Hono().basePath('/api');

// 1. Capas Globales de Seguridad
app.use('*', secureHeaders());
app.use('*', cors({
  origin: process.env.NODE_ENV === 'production' 
    ? 'https://lalista-frontend.vercel.app' 
    : 'http://localhost:5000',
  credentials: true,
}));

// 2. Enrutamiento Modular (Chaining)
const routes = app
  .route('/', productosRouter)  // Engancha /productos y /catalogo
  .route('/maps', mapsRouter);  // Engancha todos los /maps/*

// 3. Exportaciones para Next.js
export const GET = handle(app);
export const POST = handle(app);

// 4. Exportamos el tipo global para el cliente RPC del frontend
export type AppType = typeof routes;