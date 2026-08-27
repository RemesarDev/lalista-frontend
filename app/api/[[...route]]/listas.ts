// app/api/[[...route]]/listas.ts
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { supabase } from '@/app/_lib/supabase';
import { auth } from '@/app/_lib/auth';
import { guardarListaSchema } from '@/app/_lib/apiSchemas';
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

  // GET /listas/:id/items — items de una lista (agrupados por grupo/item_id)
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

    // 1. Agrupar filas de DB por su item_id (UUID del grupo)
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
    console.log('ITEMS:', JSON.stringify(items, null, 2));

    const { data, error } = await supabase.rpc('guardar_lista_usuario', {
      p_user_id: session.user.id,
      p_nombre: nombre,
      p_items: items, // El JSON validado por Zod ya coincide con el formato que la RPC espera
    });
    console.log('RPC ERROR:', error); 
    if (error) return c.json({ error: error.message }, 500);

    return c.json({ id: data }, 201);
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
  });