// app/api/[[...route]]/listas.ts
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { supabase } from '@/app/_lib/supabase';
import { auth } from '@/app/_lib/auth';
import {
  guardarListaSchema,
  sincronizarListaSchema,
  compartirListaSchema,
  actualizarRolMiembroSchema,
} from '@/app/_lib/apiSchemas';
import { 
  DbLista, 
  DbItemLista, 
  mapearLista, 
  mapearGrupoItemsLista 
} from '@/app/_lib/mappers/listas';

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

  // GET /listas/:id/items — items de una lista (agrupados por grupo_id)
  .get('/listas/:id/items', async (c) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session) return c.json({ error: 'No autorizado' }, 401);

    const listId = c.req.param('id');

    const { data, error } = await supabase.rpc('get_items_lista', {
      p_list_id: listId,
      p_user_id: session.user.id,
    });

    if (error) return c.json({ error: error.message }, 500);

    const rawRows = (data as DbItemLista[]) ?? [];

    // 1. Agrupar filas de DB por su grupo_id
    const gruposMap = new Map<string, DbItemLista[]>();
    for (const row of rawRows) {
      if (!gruposMap.has(row.grupo_id)) {
        gruposMap.set(row.grupo_id, []);
      }
      gruposMap.get(row.grupo_id)!.push(row);
    }

    // 2. Mapear cada grupo a la estructura ItemLista con opciones disyuntivas
    const items = Array.from(gruposMap.values()).map(mapearGrupoItemsLista);

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
  })

  // PATCH /listas/:id — sincronizar lista existente
  .patch('/listas/:id', zValidator('json', sincronizarListaSchema), async (c) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session) return c.json({ error: 'No autorizado' }, 401);

    const listId = c.req.param('id');
    const { items } = c.req.valid('json');
    const { data, error } = await supabase.rpc('actualizar_lista', {
      p_list_id: listId,
      p_user_id: session.user.id,
      p_items: items,
    });

    if (error) return c.json({ error: error.message }, 500);
    if (!data) return c.json({ error: 'No autorizado o lista no encontrada' }, 403);

    return c.json({ success: true }, 200);
  })

  // DELETE /listas/:id — abandonar o eliminar lista
  .delete('/listas/:id', async (c) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session) return c.json({ error: 'No autorizado' }, 401);

    const listId = c.req.param('id');

    const { data, error } = await supabase.rpc('abandonar_lista', {
      p_list_id: listId,
      p_user_id: session.user.id,
    });

    if (error) return c.json({ error: error.message }, 500);
    if (data === 'not_found') return c.json({ error: 'Lista no encontrada' }, 404);

    return c.json({ result: data }, 200);
  })

  // POST /listas/:id/miembros — compartir lista con otro usuario
  .post('/listas/:id/miembros', zValidator('json', compartirListaSchema), async (c) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session) return c.json({ error: 'No autorizado' }, 401);

    const listId = c.req.param('id');
    const { userId, rol } = c.req.valid('json');

    const { data, error } = await supabase.rpc('compartir_lista', {
      p_list_id: listId,
      p_owner_id: session.user.id,
      p_user_id: userId,
      p_rol: rol,
    });

    if (error) return c.json({ error: error.message }, 500);
    if (data === 'not_owner') return c.json({ error: 'Solo el dueño puede compartir la lista' }, 403);
    if (data === 'same_user') return c.json({ error: 'No podés compartir la lista con vos mismo' }, 400);

    return c.json({ success: true }, 200);
  })

  // GET /listas/:id/miembros — miembros y owner de una lista
  .get('/listas/:id/miembros', async (c) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session) return c.json({ error: 'No autorizado' }, 401);

    const listId = c.req.param('id');
    const { data, error } = await supabase.rpc('get_miembros_lista', {
      p_list_id: listId,
      p_owner_id: session.user.id,
    });

    if (error) return c.json({ error: error.message }, 500);
    if (data === null) return c.json({ error: 'Solo el dueño puede administrar los miembros' }, 403);

    return c.json({ miembros: data ?? [] });
  })

  // PATCH /listas/:id/miembros/:userId — cambiar rol de un miembro
  .patch('/listas/:id/miembros/:userId', zValidator('json', actualizarRolMiembroSchema), async (c) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session) return c.json({ error: 'No autorizado' }, 401);

    const { rol } = c.req.valid('json');
    const { data, error } = await supabase.rpc('actualizar_rol_miembro', {
      p_list_id: c.req.param('id'),
      p_owner_id: session.user.id,
      p_user_id: c.req.param('userId'),
      p_rol: rol,
    });

    if (error) return c.json({ error: error.message }, 500);
    if (data === 'not_owner') return c.json({ error: 'Solo el dueño puede cambiar roles' }, 403);
    if (data === 'invalid_role') return c.json({ error: 'Rol inválido' }, 400);
    if (data === 'not_found') return c.json({ error: 'Miembro no encontrado' }, 404);

    return c.json({ success: true }, 200);
  })

  // DELETE /listas/:id/miembros/:userId — quitar un miembro
  .delete('/listas/:id/miembros/:userId', async (c) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session) return c.json({ error: 'No autorizado' }, 401);

    const { data, error } = await supabase.rpc('eliminar_miembro_lista', {
      p_list_id: c.req.param('id'),
      p_owner_id: session.user.id,
      p_user_id: c.req.param('userId'),
    });

    if (error) return c.json({ error: error.message }, 500);
    if (data === 'not_owner') return c.json({ error: 'Solo el dueño puede eliminar miembros' }, 403);
    if (data === 'not_found') return c.json({ error: 'Miembro no encontrado' }, 404);

    return c.json({ success: true }, 200);
  });