import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { supabase } from '@/app/_lib/supabase';

const historicoQuerySchema = z.object({
  ids_productos: z.string().transform((val) => val.split(',').filter(Boolean)),
  // Opcionales: si se mandan, la búsqueda queda restringida a ESE
  // supermercado puntual (comportamiento original — "tus supermercados").
  // Si NO se mandan ninguno de los dos, la búsqueda queda abierta a
  // cualquier supermercado de la provincia — se usa como referencia
  // cuando el producto no tiene datos en los supermercados elegidos.
  id_comercio: z.coerce.number().optional(),
  id_bandera: z.coerce.number().optional(),
  provincia: z.string(),
});

interface FilaHistoricoSepa {
  periodo: string; // "año-mes-dia"
  id_producto: string;
  precio_lista_mediana: number;
  id_comercio: number;
  id_bandera: number;
}

/**
 * Histórico real de precios (tabla `sepa_precios_historico_mensual`,
 * datos oficiales del SEPA) para un conjunto de productos dentro de una
 * provincia. Dos modos:
 * - Con `id_comercio` + `id_bandera`: restringido a ESA cadena puntual
 *   (uso original — "tus supermercados").
 * - Sin ninguno de los dos: cualquier supermercado de la provincia (uso
 *   nuevo — precio de referencia para productos sin cobertura en los
 *   supermercados elegidos por el usuario). Por eso la fila siempre
 *   incluye `id_comercio`/`id_bandera`: así el frontend sabe de qué
 *   cadena puntual salió cada dato, aunque no la haya pedido.
 */
export const historicoRouter = new Hono().get(
  '/historico-precios',
  zValidator('query', historicoQuerySchema),
  async (c) => {
    const { ids_productos, id_comercio, id_bandera, provincia } = c.req.valid('query');

    if (!ids_productos.length) return c.json({ historico: [] });

    let query = supabase
      .from('sepa_precios_historico_mensual')
      .select('periodo, id_producto, precio_lista_mediana, id_comercio, id_bandera')
      .in('id_producto', ids_productos)
      .eq('sucursales_provincia', provincia);

    if (id_comercio !== undefined) query = query.eq('id_comercio', id_comercio);
    if (id_bandera !== undefined) query = query.eq('id_bandera', id_bandera);

    const { data, error } = await query.order('periodo', { ascending: true });

    if (error) return c.json({ error: error.message }, 500);

    const historico = (data as FilaHistoricoSepa[]) ?? [];
    return c.json({ historico });
  },
);