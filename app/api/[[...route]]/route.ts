import { handle } from 'hono/vercel';
import { app, routes } from './app';

export const runtime = 'nodejs';

// La app (middlewares, auth y routers) se arma en ./app.ts.
export const GET = handle(app);
export const POST = handle(app);
export const PUT = handle(app);
export const PATCH = handle(app);
export const DELETE = handle(app);
export type AppType = typeof routes;
