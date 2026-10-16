-- =============================================================================
-- Revocar EXECUTE al rol "authenticated" sobre las funciones de usuario
-- (hallazgo GK-06)
-- =============================================================================
-- 011 saco el EXECUTE a PUBLIC y a anon, pero dejo authenticated a proposito
-- ("la sesion la maneja better-auth, no Supabase Auth, asi que nadie tiene ese
-- rol"). Esa premisa no se sostiene:
--
--   1. Supabase Auth (GoTrue) viene habilitado en todo proyecto. Con la llave
--      publicable cualquiera hace POST /auth/v1/signup y recibe un JWT con
--      role = authenticated, aunque la app no use Supabase Auth.
--   2. La llave publicable no es secreta: estuvo en el bundle del navegador
--      como NEXT_PUBLIC_SUPABASE_ANON_KEY (ver caefe48) y los deploys viejos de
--      Vercel siguen sirviendo ese JS en su URL inmutable.
--
-- Con ese JWT, POST /rest/v1/rpc/get_listas_usuario {"p_user_id": "<id de B>"}
-- devuelve las listas de B: IDOR completo por fuera de Hono y de Better Auth.
-- Las funciones son SECURITY DEFINER y reciben el usuario por parametro, asi
-- que la unica barrera posible es el EXECUTE (mismo razonamiento que 011).
--
-- Despues de esto, solo service_role (el servidor) y postgres ejecutan estas
-- funciones.
--
-- ORDEN: sin restricciones respecto del deploy. El servidor usa service_role
-- desde caefe48, que no se ve afectado.
--
-- DONDE: en el proyecto de Supabase que tiene lista_items (LALIsta), no en
-- LALIstaMensual.
--
-- Correr este archivo dos veces no hace dano (revoke es idempotente).
--
-- ADEMAS (fuera de SQL, en el dashboard de Supabase):
--   * Authentication > Sign In / Providers: desactivar "Allow new users to sign
--     up" y el provider Email. La app no usa Supabase Auth.
--   * Settings > API Keys: si el proyecto todavia usa las llaves legacy (anon /
--     service_role JWT), migrar a las nuevas (sb_publishable_ / sb_secret_) y
--     desactivar las legacy. La anon vieja se tiene que dar por filtrada.
-- =============================================================================

begin;

-- Direcciones ----------------------------------------------------------------
revoke execute on function public.actualizar_radio_direccion(uuid, text, numeric) from authenticated;
revoke execute on function public.cambiar_direccion_activa(uuid, text) from authenticated;
revoke execute on function public.obtener_direcciones_usuario(text) from authenticated;
revoke execute on function public.agregar_direccion(text, text, double precision, double precision, integer) from authenticated;
revoke execute on function public.eliminar_direccion(uuid, text) from authenticated;

-- Listas ---------------------------------------------------------------------
revoke execute on function public.get_listas_usuario(text) from authenticated;
revoke execute on function public.get_items_lista_v2(uuid, text) from authenticated;
revoke execute on function public.get_items_lista_v3(uuid, text) from authenticated;
revoke execute on function public.guardar_lista_usuario_v2(text, text, jsonb) from authenticated;
revoke execute on function public.actualizar_lista_v2(uuid, text, jsonb) from authenticated;
revoke execute on function public.abandonar_lista(uuid, text) from authenticated;

-- Miembros de listas ---------------------------------------------------------
revoke execute on function public.compartir_lista(uuid, text, text, text) from authenticated;
revoke execute on function public.get_miembros_lista(uuid, text) from authenticated;
revoke execute on function public.actualizar_rol_miembro(uuid, text, text, text) from authenticated;
revoke execute on function public.eliminar_miembro_lista(uuid, text, text) from authenticated;

-- Busqueda de usuarios -------------------------------------------------------
revoke execute on function public.buscar_usuarios_por_email(text, text) from authenticated;

-- Tablas de Better Auth ------------------------------------------------------
-- Tienen RLS sin policies (ver 014), pero el grant de tabla sigue ahi. Si un
-- dia alguien desactiva RLS para "probar algo", session (tokens) y account
-- (hashes) quedan a un curl. Sin grant, RLS deja de ser la unica barrera.
-- Better Auth entra con el rol de DATABASE_URL (postgres), que no depende de
-- estos grants. Verificarlo antes con la consulta Q1b de
-- scripts/qa/gatekeeper/auditoria-db.sql.
revoke all on table public."user", public."session", public."account", public."verification" from anon, authenticated;

commit;

-- =============================================================================
-- Verificacion
-- =============================================================================
-- Las 16 funciones tienen que dar anon_puede = false y auth_puede = false:
--
-- select p.proname,
--        has_function_privilege('anon', p.oid, 'EXECUTE')          as anon_puede,
--        has_function_privilege('authenticated', p.oid, 'EXECUTE') as auth_puede
-- from pg_proc p
-- join pg_namespace n on n.oid = p.pronamespace
-- where n.nspname = 'public'
--   and pg_get_function_identity_arguments(p.oid) ~ '(p_user_id|p_owner_id|p_solicitante_id)'
-- order by auth_puede desc, anon_puede desc, p.proname;
--
-- Y las tablas de Better Auth sin privilegios para anon ni authenticated:
--
-- select c.relname,
--        has_table_privilege('anon', c.oid, 'SELECT')          as anon_select,
--        has_table_privilege('authenticated', c.oid, 'SELECT') as auth_select
-- from pg_class c join pg_namespace n on n.oid = c.relnamespace
-- where n.nspname = 'public' and c.relname in ('user', 'session', 'account', 'verification');
-- =============================================================================
