// app/api/[[...route]]/listas.ts
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { supabase } from '@/app/_lib/supabase';
import { errorInterno } from '@/app/api/_middlewares/errorInterno';
import { requireAuth, type EntornoAutenticado } from '@/app/api/_middlewares/requireAuth';
import { checkUserLimit } from '@/app/api/_middlewares/checkLimits'; 
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
import { enmascararEmail } from '@/app/_lib/utils/enmascararEmail';

export const listasRouter = new Hono<EntornoAutenticado>()
  // Sesion obligatoria para todo /listas, antes de cualquier validador.
  .use('/listas/*', requireAuth)

  // GET /listas — listas del usuario autenticado
  .get('/listas', async (c) => {
    const session = c.get('sesion');

    const { data, error } = await supabase.rpc('get_listas_usuario', {
      p_user_id: session.user.id,
    });

    if (error) return errorInterno(c, error);

    const listas = ((data as DbLista[]) ?? []).map(mapearLista);
    return c.json({ listas });
  })

  // GET /listas/:id/items — items de una lista (agrupados por grupo_id) y su nombre
  .get('/listas/:id/items', async (c) => {
    const session = c.get('sesion');

    const listId = c.req.param('id');

    // v3 = v2 + lista_nombre (migraciones/013_items_lista_con_nombre.sql)
    const { data, error } = await supabase.rpc('get_items_lista_v3', {
      p_list_id: listId,
      p_user_id: session.user.id,
    });

    if (error) return errorInterno(c, error);

    const rawRows = (data as DbItemLista[]) ?? [];

    const gruposMap = new Map<string, DbItemLista[]>();
    for (const row of rawRows) {
      if (!gruposMap.has(row.grupo_id)) {
        gruposMap.set(row.grupo_id, []);
      }
      gruposMap.get(row.grupo_id)!.push(row);
    }

    const items = Array.from(gruposMap.values()).map(mapearGrupoItemsLista);
    // Todas las filas traen el mismo nombre. Lista vacía → null.
    const nombre = rawRows[0]?.lista_nombre ?? null;

    return c.json({ items, nombre });
  })

  // POST /listas — guardar lista nueva
  .post('/listas', zValidator('json', guardarListaSchema), async (c) => {
    const session = c.get('sesion');

    // 1. Validar límite de listas del usuario antes de insertar
    const limitError = await checkUserLimit(c, supabase, session.user.id, 'listas');
    if (limitError) return limitError;

    const { nombre, items } = c.req.valid('json');

    const { data, error } = await supabase.rpc('guardar_lista_usuario_v2', {
      p_user_id: session.user.id,
      p_nombre: nombre,
      p_items: items,
    });

    if (error) return errorInterno(c, error);

    return c.json({ id: data }, 201);
  })

  // PATCH /listas/:id — sincronizar lista existente (y renombrar si es owner)
  .patch('/listas/:id', zValidator('json', sincronizarListaSchema), async (c) => {
    const session = c.get('sesion');

    const listId = c.req.param('id');
    const { items, nombre } = c.req.valid('json');

    const { data, error } = await supabase.rpc('actualizar_lista_v2', {
      p_list_id: listId,
      p_user_id: session.user.id,
      p_items: items,
      p_nombre: nombre ?? null,
    });

    if (error) return errorInterno(c, error);
    if (!data) return c.json({ error: 'No autorizado o lista no encontrada' }, 403);

    return c.json({ success: true }, 200);
  })

  // DELETE /listas/:id — abandonar o eliminar lista
  .delete('/listas/:id', async (c) => {
    const session = c.get('sesion');

    const listId = c.req.param('id');

    const { data, error } = await supabase.rpc('abandonar_lista', {
      p_list_id: listId,
      p_user_id: session.user.id,
    });

    if (error) return errorInterno(c, error);
    if (data === 'not_found') return c.json({ error: 'Lista no encontrada' }, 404);

    return c.json({ result: data }, 200);
  })

  // POST /listas/:id/miembros — compartir lista con otro usuario
  .post('/listas/:id/miembros', zValidator('json', compartirListaSchema), async (c) => {
    const session = c.get('sesion');

    const listId = c.req.param('id');
    const { userId, rol } = c.req.valid('json');

    // 2. Si el rol que se asigna es 'editor' o 'viewer', validamos el límite de editores para esta lista
    if (rol === 'editor' || rol === 'viewer') {
      const limitError = await checkUserLimit(c, supabase, session.user.id, 'editores', listId);
      if (limitError) return limitError;
    }

    const { data, error } = await supabase.rpc('compartir_lista', {
      p_list_id: listId,
      p_owner_id: session.user.id,
      p_user_id: userId,
      p_rol: rol,
    });

    if (error) return errorInterno(c, error);
    if (data === 'not_owner') return c.json({ error: 'Solo el dueño puede compartir la lista' }, 403);
    if (data === 'same_user') return c.json({ error: 'No podés compartir la lista con vos mismo' }, 400);

    return c.json({ success: true }, 200);
  })

  // GET /listas/:id/miembros — miembros y owner de una lista
  .get('/listas/:id/miembros', async (c) => {
    const session = c.get('sesion');

    const listId = c.req.param('id');
    const { data, error } = await supabase.rpc('get_miembros_lista', {
      p_list_id: listId,
      p_owner_id: session.user.id,
    });

    if (error) return errorInterno(c, error);
    if (data === null) return c.json({ error: 'Solo el dueño puede administrar los miembros' }, 403);

    const miembros = ((data as Array<{ email: string }>) ?? []).map((miembro) => ({
      ...miembro,
      email: enmascararEmail(miembro.email),
    }));

    return c.json({ miembros });
  })

  // PATCH /listas/:id/miembros/:userId — cambiar rol de un miembro
  .patch('/listas/:id/miembros/:userId', zValidator('json', actualizarRolMiembroSchema), async (c) => {
    const session = c.get('sesion');

    const listId = c.req.param('id');
    const { rol } = c.req.valid('json');

    // Si pasa a ser editor, validamos el límite
    if (rol === 'editor') {
      const limitError = await checkUserLimit(c, supabase, session.user.id, 'editores', listId);
      if (limitError) return limitError;
    }

    const { data, error } = await supabase.rpc('actualizar_rol_miembro', {
      p_list_id: listId,
      p_owner_id: session.user.id,
      p_user_id: c.req.param('userId'),
      p_rol: rol,
    });

    if (error) return errorInterno(c, error);
    if (data === 'not_owner') return c.json({ error: 'Solo el dueño puede cambiar roles' }, 403);
    if (data === 'invalid_role') return c.json({ error: 'Rol inválido' }, 400);
    if (data === 'not_found') return c.json({ error: 'Miembro no encontrado' }, 404);

    return c.json({ success: true }, 200);
  })

  // DELETE /listas/:id/miembros/:userId — quitar un miembro
  .delete('/listas/:id/miembros/:userId', async (c) => {
    const session = c.get('sesion');

    const { data, error } = await supabase.rpc('eliminar_miembro_lista', {
      p_list_id: c.req.param('id'),
      p_owner_id: session.user.id,
      p_user_id: c.req.param('userId'),
    });

    if (error) return errorInterno(c, error);
    if (data === 'not_owner') return c.json({ error: 'Solo el dueño puede eliminar miembros' }, 403);
    if (data === 'not_found') return c.json({ error: 'Miembro no encontrado' }, 404);

    return c.json({ success: true }, 200);
  });