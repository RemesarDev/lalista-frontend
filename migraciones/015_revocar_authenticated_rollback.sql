-- =============================================================================
-- ROLLBACK DE EMERGENCIA de 015_revocar_authenticated.sql
-- =============================================================================
-- Devuelve los permisos al estado exacto que se midio en produccion el
-- 2026-10-16, justo antes de aplicar 015:
--
--   * authenticated: EXECUTE en las 19 funciones de usuario.
--   * anon y PUBLIC: EXECUTE solo en estas cuatro (GK-20):
--       actualizar_lista_v2(uuid, text, jsonb, text)
--       actualizar_lista(uuid, text, jsonb)
--       guardar_lista_usuario(text, text, jsonb)
--       get_items_lista(uuid, text)
--   * anon y authenticated: los grants de tabla de user/session/account/
--     verification.
--
-- Cuando se usa: solo si despues de 015 algo que SI usa anon o authenticated
-- deja de andar. Segun el codigo actual nada los usa: el servidor va con
-- service_role y Better Auth con el rol de DATABASE_URL (postgres).
-- Reabrir esto vuelve a dejar el IDOR por /rest/v1/rpc descripto en 015.
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
    execute format('grant execute on function %s to authenticated', f.firma);
  end loop;
end $$;

grant execute on function public.actualizar_lista_v2(uuid, text, jsonb, text) to public, anon;
grant execute on function public.actualizar_lista(uuid, text, jsonb) to public, anon;
grant execute on function public.guardar_lista_usuario(text, text, jsonb) to public, anon;
grant execute on function public.get_items_lista(uuid, text) to public, anon;

grant all on table public."user", public."session", public."account", public."verification" to anon, authenticated;

commit;
