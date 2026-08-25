// app/api/[[...route]]/listas.ts
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { supabase } from '@/app/_lib/supabase';
import { auth } from '@/app/_lib/auth';
import { guardarListaSchema } from '@/app/_lib/apiSchemas';
import { DbLista, DbItemLista, mapearLista, mapearItemLista } from '@/app/_lib/mappers/listas';

export const listasRouter = new Hono()

  // GET /listas — listas del usuario autenticado
  .get('/listas', async (c) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session) return c.json({ error: 'No autorizado' }, 401);

    const { data, error } = await supabase.rpc('get_listas_usuario', {
      p_user_id: session.user.id,
    });

    if (error) return c.json({ error: error.message }, 500);

    const listas = ((data as DbLista[]) ?? []).map(mapearLista);
    return c.json({ listas });
  })

  // GET /listas/:id/items — items de una lista
  .get('/listas/:id/items', async (c) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session) return c.json({ error: 'No autorizado' }, 401);

    const listId = c.req.param('id');

    const { data, error } = await supabase.rpc('get_items_lista', {
      p_list_id: listId,
    });

    if (error) return c.json({ error: error.message }, 500);

    const items = ((data as DbItemLista[]) ?? []).map(mapearItemLista);
    return c.json({ items });
  })

  // POST /listas — guardar lista nueva
  .post('/listas', zValidator('json', guardarListaSchema), async (c) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session) return c.json({ error: 'No autorizado' }, 401);

    const { nombre, items } = c.req.valid('json');

    const { data, error } = await supabase.rpc('guardar_lista_usuario', {
      p_user_id: session.user.id,
      p_nombre: nombre,
      p_items: items,
    });

    if (error) return c.json({ error: error.message }, 500);

    return c.json({ id: data }, 201);
  });