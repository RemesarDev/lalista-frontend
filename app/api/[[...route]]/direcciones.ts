// app/api/[[...route]]/direcciones.ts
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { supabase } from '@/app/_lib/supabase';
import { auth } from '@/app/_lib/auth';
import {
  agregarDireccionSchema,
  actualizarRadioDireccionSchema,
} from '@/app/_lib/apiSchemas';

export const direccionesRouter = new Hono()

  // GET /direcciones — todas las direcciones del usuario
  .get('/direcciones', async (c) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session) return c.json({ error: 'No autorizado' }, 401);

    const { data, error } = await supabase.rpc('obtener_direcciones_usuario', {
      p_user_id: session.user.id,
    });

    if (error) return c.json({ error: error.message }, 500);

    return c.json({ direcciones: data ?? [] });
  })

  // POST /direcciones — agregar nueva dirección
  .post('/direcciones', zValidator('json', agregarDireccionSchema), async (c) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session) return c.json({ error: 'No autorizado' }, 401);

    const { nombre_lugar, latitud, longitud, radio_busqueda } = c.req.valid('json');

    const { data, error } = await supabase.rpc('agregar_direccion', {
      p_user_id:      session.user.id,
      p_nombre_lugar: nombre_lugar,
      p_latitud:      latitud,
      p_longitud:     longitud,
      p_radio:        radio_busqueda,
    });

    if (error) return c.json({ error: error.message }, 500);

    return c.json({ direccion: data }, 201);
  })

  // PATCH /direcciones/:id/activar — cambiar dirección activa
  .patch('/direcciones/:id/activar', async (c) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session) return c.json({ error: 'No autorizado' }, 401);

    const { data, error } = await supabase.rpc('cambiar_direccion_activa', {
      p_id:      c.req.param('id'),
      p_user_id: session.user.id,
    });

    if (error) return c.json({ error: error.message }, 500);

    return c.json({ direccion: data }, 200);
  })

  // PATCH /direcciones/:id/radio — actualizar radio de búsqueda
  .patch('/direcciones/:id/radio', zValidator('json', actualizarRadioDireccionSchema), async (c) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session) return c.json({ error: 'No autorizado' }, 401);

    const { radio_busqueda } = c.req.valid('json');

    const { data, error } = await supabase.rpc('actualizar_radio_direccion', {
      p_id:      c.req.param('id'),
      p_user_id: session.user.id,
      p_radio:   radio_busqueda,
    });

    if (error) return c.json({ error: error.message }, 500);

    return c.json({ direccion: data }, 200);
  })

  // DELETE /direcciones/:id — eliminar una dirección
  .delete('/direcciones/:id', async (c) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session) return c.json({ error: 'No autorizado' }, 401);

    const { error } = await supabase.rpc('eliminar_direccion', {
      p_id:      c.req.param('id'),
      p_user_id: session.user.id,
    });

    if (error) return c.json({ error: error.message }, 500);

    return c.json({ success: true }, 200);
  });