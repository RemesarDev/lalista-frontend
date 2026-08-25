// app/api/[[...route]]/listas.ts
import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { supabase } from '@/app/_lib/supabase';
import { auth } from '@/app/_lib/auth';

// ==========================================
// TIPOS DE RESPUESTA (DB → TS)
// ==========================================
interface DbLista {
  id: string;
  nombre: string;
  owner_id: string;
  created_at: string;
  rol: 'owner' | 'editor' | 'viewer';
}

interface DbItemLista {
  item_id: string;
  id_producto: string;
  descripcion: string;
  imagen: string | null;
  cantidad: number;
  is_checked: boolean;
}

// ==========================================
// SCHEMAS DE VALIDACIÓN
// ==========================================
const guardarListaSchema = z.object({
  nombre: z.string().min(1, 'El nombre es obligatorio').max(100),
  items: z.array(z.object({
    id_producto: z.string(),
    cantidad: z.number().int().min(1),
    is_checked: z.boolean(),
  })).min(1, 'La lista debe tener al menos un producto'),
});

// ==========================================
// ROUTER
// ==========================================
export const listasRouter = new Hono()

  // GET /listas — listas del usuario autenticado
  .get('/listas', async (c) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session) return c.json({ error: 'No autorizado' }, 401);

    const { data, error } = await supabase.rpc('get_listas_usuario', {
      p_user_id: session.user.id,
    });

    if (error) return c.json({ error: error.message }, 500);

    return c.json({ listas: (data as DbLista[]) ?? [] });
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

    return c.json({ items: (data as DbItemLista[]) ?? [] });
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