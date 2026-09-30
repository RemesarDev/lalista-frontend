import { Hono } from 'hono';
import { insertAnalyticsEvent } from '@/app/_lib/utils/analytics';
import { analyticsEventSchema } from '@/app/_lib/apiSchemas';
import { sanitizeAndValidateMetadata } from '@/app/_lib/utils/validacionMetadata';
import { auth } from '@/app/_lib/auth';

export const analyticsRouter = new Hono();

analyticsRouter.post('/analytics', async (c) => {
  try {
    const rawBody = await c.req.json();

    // 1. Validar y tipar usando Zod de forma segura
    const result = analyticsEventSchema.safeParse(rawBody);
    if (!result.success) {
      return c.json({ error: 'Datos de analítica inválidos', details: result.error.format() }, 400);
    }

    const { eventName, metadata } = result.data;

    // 2. VALIDAR USER ID CONTRA LA SESIÓN ACTIVA (Mitigación de IDOR / Spoofing)
    const session = await auth.api.getSession({
        headers: c.req.raw.headers,
    });
    // Forzamos el userId real de la sesión (si está logueado, sino null)
    const verifiedUserId = session?.user?.id || null;

    // 3. VALIDAR TAMAÑO Y ESTRUCTURA DE METADATA (Defensa contra DoS / payloads masivos)
    const metadataValidation = sanitizeAndValidateMetadata(metadata);
    if (!metadataValidation.valid) {
      return c.json({ error: metadataValidation.error }, 400);
    }

    // 4. Extraer país, provincia y ciudad de los headers de Vercel con decodificación segura
    const country = c.req.header('x-vercel-ip-country') || 'AR';
    const rawProvince = c.req.header('x-vercel-ip-country-region');
    const rawCity = c.req.header('x-vercel-ip-city');

    const province = rawProvince ? decodeURIComponent(rawProvince) : null;
    const city = rawCity ? decodeURIComponent(rawCity) : null;

    // Campo general de región heredado por compatibilidad (prioriza ciudad, luego provincia, luego país)
    const fallbackRegion = city || province || country;

    // 5. Insertar enriqueciendo el metadata validado con la ubicación detallada
    await insertAnalyticsEvent({
      eventName,
      region: fallbackRegion,
      userId: verifiedUserId, // Usamos el ID verificado, no el del body
      metadata: {
        ...metadataValidation.sanitized,
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