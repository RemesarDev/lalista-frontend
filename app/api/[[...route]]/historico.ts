import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { supabase } from '@/app/_lib/supabase';

const historicoQuerySchema = z.object({
  ids_productos: z.string().transform((val) => val.split(',').filter(Boolean)),
  id_comercio: z.coerce.number(),
  id_bandera: z.coerce.number(),
  provincia: z.string(),
});

interface FilaHistoricoSepa {
  periodo: string; // "YYYY-MM-DD"
  id_producto: string;
  precio_lista_mediana: number;
}

/**
 * Histórico real de precios (tabla `sepa_precios_historico_mensual`,
 * datos oficiales del SEPA) para un conjunto de productos en UNA cadena
 * puntual (id_comercio + id_bandera) dentro de una provincia. Se usa para
 * poder mostrar, apenas se arma un changuito, cómo venían esos productos
 * en esa cadena desde antes — sin tener que esperar a acumular meses de
 * seguimiento propio.
 */
export const historicoRouter = new Hono().get(
  '/historico-precios',
  zValidator('query', historicoQuerySchema),
  async (c) => {
    const { ids_productos, id_comercio, id_bandera, provincia } = c.req.valid('query');

    if (!ids_productos.length) return c.json({ historico: [] });

    const { data, error } = await supabase
      .from('sepa_precios_historico_mensual')
      .select('periodo, id_producto, precio_lista_mediana')
      .in('id_producto', ids_productos)
      .eq('id_comercio', id_comercio)
      .eq('id_bandera', id_bandera)
      .eq('sucursales_provincia', provincia)
      .order('periodo', { ascending: true });

    if (error) return c.json({ error: error.message }, 500);

    const historico = (data as FilaHistoricoSepa[]) ?? [];
    return c.json({ historico });
  },
);