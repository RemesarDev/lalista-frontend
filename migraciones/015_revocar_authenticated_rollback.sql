-- =============================================================================
-- ROLLBACK DE EMERGENCIA de 015_revocar_authenticated.sql
-- =============================================================================
-- Devuelve el EXECUTE a authenticated en las 16 funciones y los grants de tabla
-- de Better Auth a anon/authenticated, es decir, el estado previo a 015 (ver el
-- ACL documentado en 011_revocar_anon_rollback.sql).
--
-- Cuando se usa: solo si despues de 015 algo que SI usa el rol authenticated
-- deja de andar. Segun el codigo actual nada lo usa: el servidor va con
-- service_role y Better Auth con el rol de DATABASE_URL. Reabrir esto vuelve a
-- dejar el IDOR por /rest/v1/rpc descripto en 015.
-- =============================================================================

begin;

grant execute on function public.actualizar_radio_direccion(uuid, text, numeric) to authenticated;
grant execute on function public.cambiar_direccion_activa(uuid, text) to authenticated;
grant execute on function public.obtener_direcciones_usuario(text) to authenticated;
grant execute on function public.agregar_direccion(text, text, double precision, double precision, integer) to authenticated;
grant execute on function public.eliminar_direccion(uuid, text) to authenticated;

grant execute on function public.get_listas_usuario(text) to authenticated;
grant execute on function public.get_items_lista_v2(uuid, text) to authenticated;
grant execute on function public.get_items_lista_v3(uuid, text) to authenticated;
grant execute on function public.guardar_lista_usuario_v2(text, text, jsonb) to authenticated;
grant execute on function public.actualizar_lista_v2(uuid, text, jsonb) to authenticated;
grant execute on function public.abandonar_lista(uuid, text) to authenticated;

grant execute on function public.compartir_lista(uuid, text, text, text) to authenticated;
grant execute on function public.get_miembros_lista(uuid, text) to authenticated;
grant execute on function public.actualizar_rol_miembro(uuid, text, text, text) to authenticated;
grant execute on function public.eliminar_miembro_lista(uuid, text, text) to authenticated;

grant execute on function public.buscar_usuarios_por_email(text, text) to authenticated;

grant all on table public."user", public."session", public."account", public."verification" to anon, authenticated;

commit;
