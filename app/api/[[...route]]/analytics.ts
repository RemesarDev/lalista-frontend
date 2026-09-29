import { Hono } from 'hono';
import { insertAnalyticsEvent } from '@/app/_lib/utils/analytics';
import { analyticsEventSchema } from '@/app/_lib/apiSchemas'; // <--- Importamos tu esquema

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

    // 2. Extraer región de los headers
    const vercelRegion = c.req.header('x-vercel-ip-city') || 'Argentina';
    const region = decodeURIComponent(vercelRegion);

    // 3. Insertar mediante la librería segura
    await insertAnalyticsEvent({
      eventName,
      region,
      userId: userId || null,
      metadata
    });

    return c.json({ success: true }, 200);
  } catch (err) {
    console.error('Error procesando el evento analítico:', err);
    return c.json({ error: 'Error interno del servidor' }, 500);
  }
});