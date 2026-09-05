// app/api/[[...route]]/usuarios.ts
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { supabase } from '@/app/_lib/supabase';
import { auth } from '@/app/_lib/auth';
import { buscarUsuariosSchema } from '@/app/_lib/apiSchemas';
import { DbUsuarioPublico, mapearUsuarioPublico } from '@/app/_lib/mappers/usuarios';

export const usuariosRouter = new Hono()

  // GET /usuarios?email= — buscar usuarios por email para compartir lista
  .get('/usuarios', zValidator('query', buscarUsuariosSchema), async (c) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session) {
      c.status(401);
      return c.json({ error: 'No autorizado' });
    }

    const { email } = c.req.valid('query');
    console.log('Buscando email:', email); // temporal

    const { data, error } = await supabase.rpc('buscar_usuarios_por_email', {
      p_email: email,
      p_solicitante_id: session.user.id,
    });

    console.log('Resultado:', data, 'Error:', error); // temporal

    if (error) return c.json({ error: error.message }, 500);

    const usuarios = ((data as DbUsuarioPublico[]) ?? []).map(mapearUsuarioPublico);
    return c.json({ usuarios });
  });