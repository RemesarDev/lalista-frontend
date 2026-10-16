-- =============================================================================
-- Cerrar las funciones de usuario a todo rol que no sea service_role
-- (hallazgos GK-06 y GK-20)
-- =============================================================================
-- APLICADA EN PRODUCCION el 2026-10-16 (proyecto LALIsta), con este mismo
-- texto. Antes de correrla se verifico que DATABASE_URL entra como postgres
-- (usuario postgres.<ref> del pooler), que no depende de estos grants.
--
-- Que habia abierto:
--
--   GK-06: 011 saco el EXECUTE a PUBLIC y a anon, pero dejo authenticated
--   ("nadie tiene ese rol"). Supabase Auth entrega ese rol a cualquiera que se
--   registre con la llave publicable, que estuvo en el bundle del navegador
--   (NEXT_PUBLIC_SUPABASE_ANON_KEY, ver caefe48). Con ese JWT,
--   /rest/v1/rpc/<funcion> con el p_user_id de otro = IDOR completo.
--
--   GK-20: 011 revoco firmas escritas a mano, y varias ya no eran las reales.
--   Al aplicar esta migracion, estas cuatro seguian ejecutables por anon (sin
--   cuenta, solo la llave publicable):
--     actualizar_lista_v2(uuid, text, jsonb, text)  <- la que usa la app hoy;
--                                                      011 revoco la de 3 args
--     actualizar_lista(uuid, text, jsonb)           <- version vieja, sin uso
--     guardar_lista_usuario(text, text, jsonb)      <- version vieja, sin uso
--     get_items_lista(uuid, text)                   <- version vieja, sin uso
--
-- Por eso esta version NO escribe firmas: toma de pg_proc toda funcion de
-- public que reciba un usuario por parametro (p_user_id, p_owner_id,
-- p_solicitante_id). Esas funciones son SECURITY DEFINER y validan ownership
-- contra el mismo parametro que manda quien llama, asi que el EXECUTE es la
-- unica barrera (ver 011). Una funcion nueva con esos parametros queda
-- cubierta si se vuelve a correr este archivo; mejor todavia, crearla ya con
-- "revoke ... from public, anon, authenticated" como hace 013.
--
-- Las funciones de catalogo (no reciben usuario) no se tocan.
--
-- Correr este archivo dos veces no hace dano.
--
-- ADEMAS, en el dashboard de Supabase:
--   * Authentication > Sign In / Providers: desactivar "Allow new users to
--     sign up". La app no usa Supabase Auth.
--   * Si se rotan las llaves (legacy -> sb_publishable_ / sb_secret_): cargar
--     PRIMERO la nueva en SERVICE_ROLE_KEY_SUPABASE en Vercel y redeployar,
--     despues desactivar las legacy. Al reves, la app se queda sin base.
-- =============================================================================

begin;

do $$
declare f record;
begin
  for f in
    select p.oid::regprocedure as firma
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and pg_get_function_identity_arguments(p.oid) ~ '(p_user_id|p_owner_id|p_solicitante_id)'
      and not exists (select 1 from pg_depend d where d.objid = p.oid and d.deptype = 'e')
  loop
    execute format('revoke execute on function %s from public, anon, authenticated', f.firma);
    execute format('grant execute on function %s to service_role', f.firma);
    raise notice 'cerrada: %', f.firma;
  end loop;
end $$;

-- Tablas de Better Auth: tienen RLS sin policies (ver 014), pero el grant de
-- tabla seguia ahi. Sin grant, RLS deja de ser la unica barrera.
revoke all on table public."user", public."session", public."account", public."verification" from anon, authenticated;

commit;

-- =============================================================================
-- Verificacion (resultado en produccion el 2026-10-16: 19 funciones, todas
-- false/false)
-- =============================================================================
-- select p.oid::regprocedure as funcion,
--        has_function_privilege('anon', p.oid, 'EXECUTE')          as anon_puede,
--        has_function_privilege('authenticated', p.oid, 'EXECUTE') as auth_puede
-- from pg_proc p
-- join pg_namespace n on n.oid = p.pronamespace
-- where n.nspname = 'public'
--   and pg_get_function_identity_arguments(p.oid) ~ '(p_user_id|p_owner_id|p_solicitante_id)'
--   and not exists (select 1 from pg_depend d where d.objid = p.oid and d.deptype = 'e')
-- order by anon_puede desc, auth_puede desc, 1;
-- =============================================================================
