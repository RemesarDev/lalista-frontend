// app/api/[[...route]]/usuarios.ts
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { supabase } from '@/app/_lib/supabase';
import { errorInterno } from '@/app/api/_middlewares/errorInterno';
import { requireAuth, type EntornoAutenticado } from '@/app/api/_middlewares/requireAuth';
import { buscarUsuariosSchema } from '@/app/_lib/apiSchemas';
import { DbUsuarioPublico, mapearUsuarioPublico } from '@/app/_lib/mappers/usuarios';
import { enmascararEmail } from '@/app/_lib/utils/enmascararEmail';

export const usuariosRouter = new Hono<EntornoAutenticado>()
  // Sesion obligatoria para todo /usuarios, antes de cualquier validador.
  .use('/usuarios/*', requireAuth)

  // GET /usuarios?email= — buscar usuarios por email para compartir lista
  .get('/usuarios', zValidator('query', buscarUsuariosSchema), async (c) => {
    const session = c.get('sesion');

    const { email } = c.req.valid('query');

    const { data, error } = await supabase.rpc('buscar_usuarios_por_email', {
      p_email: email,
      p_solicitante_id: session.user.id,
    });

    if (error) return errorInterno(c, error);

    const usuarios = ((data as DbUsuarioPublico[]) ?? []).map((u) => ({
      ...mapearUsuarioPublico(u),
      email: enmascararEmail(u.email),
    }));

    return c.json({ usuarios });
  });