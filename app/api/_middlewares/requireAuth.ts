// app/api/_middlewares/requireAuth.ts
// =============================================================================
// Guard de sesion para los routers de datos de usuario
// =============================================================================
// Antes cada handler llamaba a getSession() por su cuenta. Funcionaba, pero
// tenia dos problemas:
//   1. En las rutas con zValidator, el validador corria ANTES que el chequeo de
//      sesion: un request sin cookie recibia 400 con el detalle del schema en
//      vez de 401, y el servidor procesaba el body de cualquiera.
//   2. La proteccion dependia de que cada handler nuevo se acordara de copiar
//      las dos lineas. Uno que se olvidara quedaba publico sin que nada avisara.
//
// Con este middleware montado a nivel router (.use('/listas/*', requireAuth))
// la sesion se valida primero y una sola vez, y los handlers la leen con
// c.get('sesion'). El test scripts/qa/gatekeeper/offline/rutas.test.ts recorre
// todas las rutas de la API y falla si alguna fuera de la lista de publicas
// responde algo distinto de 401/403 sin sesion.
// =============================================================================

import { createMiddleware } from 'hono/factory';
import { auth } from '@/app/_lib/auth';

export type Sesion = NonNullable<Awaited<ReturnType<typeof auth.api.getSession>>>;
export type EntornoAutenticado = { Variables: { sesion: Sesion } };

export const requireAuth = createMiddleware<EntornoAutenticado>(async (c, next) => {
  const sesion = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!sesion) return c.json({ error: 'No autorizado' }, 401);
  c.set('sesion', sesion);
  await next();
});
