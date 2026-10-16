// app/api/_middlewares/errorInterno.ts
// =============================================================================
// Respuesta generica para errores de base (hallazgo GK-05)
// =============================================================================
// Los routers devolvian error.message de Supabase/PostgREST tal cual. Eso le
// muestra a cualquiera nombres de funciones, columnas, constraints y tipos
// ("invalid input syntax for type uuid", "function get_items_lista_v3(...)
// does not exist"...): un mapa del esquema para armar el proximo ataque. El
// detalle va al log del servidor y el cliente recibe un mensaje fijo.
// =============================================================================

import type { Context } from 'hono';

export function errorInterno(c: Context, error: unknown) {
  console.error('[API DB ERROR]', { metodo: c.req.method, ruta: c.req.path, error });
  return c.json({ error: 'Error interno del servidor' }, 500);
}
