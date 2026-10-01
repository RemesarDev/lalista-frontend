import { Hono } from 'hono';
import { auth } from '@/app/_lib/auth';
import { supportMessageSchema } from '@/app/_lib/apiSchemas';
import { insertSupportMessage } from '@/app/_lib/utils/support';

export const supportRouter = new Hono();

supportRouter.post('/support', async (c) => {
  try {
    // 1. Validar sesión activa (Mitigación IDOR / Spoofing)
    const session = await auth.api.getSession({
      headers: c.req.raw.headers,
    });

    if (!session || !session.user) {
      return c.json({ error: 'No autorizado. Debes iniciar sesión para enviar una consulta.' }, 401);
    }

    const { id: verifiedUserId, name: verifiedUserName, email: verifiedUserEmail } = session.user;

    // 2. Validar body con Zod
    const rawBody = await c.req.json();
    const result = supportMessageSchema.safeParse(rawBody);

    if (!result.success) {
      return c.json({ error: 'Datos de soporte inválidos', details: result.error.format() }, 400);
    }

    const { subjectCategory, message } = result.data;

    // 3. Extraer ubicación de los headers de Vercel
    const country = c.req.header('x-vercel-ip-country') || 'AR';
    const rawProvince = c.req.header('x-vercel-ip-country-region');
    const rawCity = c.req.header('x-vercel-ip-city');

    const province = rawProvince ? decodeURIComponent(rawProvince) : null;
    const city = rawCity ? decodeURIComponent(rawCity) : null;
    const fallbackRegion = city || province || country;

    // 4. Guardar en DB2 asociando al usuario real de la sesión
    await insertSupportMessage({
      userId: verifiedUserId,
      userName: verifiedUserName,
      userEmail: verifiedUserEmail,
      subjectCategory,
      message,
      region: fallbackRegion,
    });

    return c.json({ success: true, message: 'Mensaje enviado correctamente' }, 200);
  } catch (err) {
    console.error('Error procesando el mensaje de soporte:', err);
    return c.json({ error: 'Error interno del servidor' }, 500);
  }
});