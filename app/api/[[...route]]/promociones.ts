import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { supabaseHistorico } from '@/app/_lib/supabaseHistorico';

const promocionesQuerySchema = z.object({
  // Día de la semana: 1 = lunes ... 7 = domingo. Si no viene, trae todas.
  dia: z.coerce.number().int().min(1).max(7).optional(),
});

export interface PromocionBancaria {
  id: number;
  id_comercio: number | null;
  id_bandera: number | null;
  cadena: string;
  entidad: string;
  tipo_promo: 'descuento' | 'cuotas';
  dias: number[];
  porcentaje: number | null;
  cuotas: number | null;
  tope: number | null;
  tope_periodo: 'compra' | 'dia' | 'semana' | 'mes' | null;
  tipo_tarjeta: 'credito' | 'debito' | 'cualquiera' | null;
  canal: 'presencial' | 'online' | 'ambos' | null;
  vigencia_desde: string | null;
  vigencia_hasta: string | null;
  condiciones: string | null;
  fuente: string;
  id_origen: string | null;
  fecha_actualizacion: string;
}

/** Fecha de hoy en Argentina, en formato "año-mes-día". */
const hoyEnArgentina = () =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' }).format(new Date());

/**
 * Promociones bancarias vigentes (tabla `promociones_bancarias` de la base
 * de pruebas). Las carga una vez por día el programa `cargar_promos.py`.
 */
export const promocionesRouter = new Hono().get(
  '/promociones-bancarias',
  zValidator('query', promocionesQuerySchema),
  async (c) => {
    const { dia } = c.req.valid('query');
    const hoy = hoyEnArgentina();

    let consulta = supabaseHistorico
      .from('promociones_bancarias')
      .select('*')
      // Solo las que no vencieron (o no tienen fecha de fin)
      .or(`vigencia_hasta.is.null,vigencia_hasta.gte.${hoy}`)
      .order('cadena', { ascending: true })
      .order('porcentaje', { ascending: false, nullsFirst: false });

    if (dia) {
      consulta = consulta.contains('dias', [dia]);
    }

    const { data, error } = await consulta;
    if (error) return c.json({ error: error.message }, 500);

    const promociones = (data as PromocionBancaria[]) ?? [];
    return c.json({ promociones });
  },
);