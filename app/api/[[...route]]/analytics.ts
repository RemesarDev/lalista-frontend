import { Hono } from 'hono';
import { insertAnalyticsEvent } from '@/app/_lib/utils/analytics';
import { analyticsEventSchema } from '@/app/_lib/apiSchemas';

export const analyticsRouter = new Hono();

analyticsRouter.post('/analytics', async (c) => {
  try {
    const rawBody = await c.req.json();

    // 1. Validar y tipar usando Zod de forma segura
    const result = analyticsEventSchema.safeParse(rawBody);
    if (!result.success) {
      return c.json({ error: 'Datos de analítica inválidos', details: result.error.format() }, 400);
    }

    const { eventName, userId, metadata } = result.data;

    // 2. Extraer país, provincia y ciudad de los headers de Vercel con decodificación segura
    const country = c.req.header('x-vercel-ip-country') || 'AR';
    const rawProvince = c.req.header('x-vercel-ip-country-region');
    const rawCity = c.req.header('x-vercel-ip-city');

    const province = rawProvince ? decodeURIComponent(rawProvince) : null;
    const city = rawCity ? decodeURIComponent(rawCity) : null;

    // Campo general de región heredado por compatibilidad (prioriza ciudad, luego provincia, luego país)
    const fallbackRegion = city || province || country;

    // 3. Insertar enriqueciendo el metadata con la ubicación detallada
    await insertAnalyticsEvent({
      eventName,
      region: fallbackRegion,
      userId: userId || null,
      metadata: {
        ...metadata,
        country,
        province,
        city,
      }
    });

    return c.json({ success: true }, 200);
  } catch (err) {
    console.error('Error procesando el evento analítico:', err);
    return c.json({ error: 'Error interno del servidor' }, 500);
  }
});