-- =============================================================================
-- Revocar EXECUTE a la llave publicable sobre las funciones de usuario
-- =============================================================================
-- Estas funciones reciben el identificador de usuario como parametro y validan
-- ownership contra ese mismo valor, asi que quien llama al RPC directo provee los dos
-- lados de la comparacion y elige de que usuario hablar. SECURITY DEFINER las hace
-- correr como postgres, de modo que RLS no las frena: la unica barrera posible es el
-- permiso de EXECUTE.
--
-- La clausula es "from public, anon" y no solo "from anon" porque el permiso le llega
-- a anon por dos caminos. El ACL de estas funciones es:
--
--   =X/postgres + postgres=X/postgres + anon=X/postgres + authenticated=X/postgres + service_role=X/postgres
--   ^
--   sin destinatario a la izquierda del "=" es un grant al pseudo-rol PUBLIC, que en
--   Postgres significa "cualquier rol" y por lo tanto alcanza a anon. Revocarle solo a
--   anon deja ese grant en pie y no cambia nada.
--
-- authenticated queda afuera a proposito: la sesion la maneja better-auth, no Supabase
-- Auth, asi que nadie tiene ese rol.
-- service_role no se toca nunca: es el que usa el servidor (app/_lib/supabase.ts).
--
-- ORDEN: correr esto DESPUES de deployar el servidor con SERVICE_ROLE_KEY_SUPABASE.
-- Al reves, los endpoints quedan sin permiso hasta que el deploy suba.
-- =============================================================================

begin;

-- Direcciones ----------------------------------------------------------------
revoke execute on function public.actualizar_radio_direccion(uuid, text, numeric) from public, anon;
revoke execute on function public.cambiar_direccion_activa(uuid, text) from public, anon;
revoke execute on function public.obtener_direcciones_usuario(text) from public, anon;
revoke execute on function public.agregar_direccion(text, text, double precision, double precision, integer) from public, anon;
revoke execute on function public.eliminar_direccion(uuid, text) from public, anon;

-- Listas ---------------------------------------------------------------------
revoke execute on function public.get_listas_usuario(text) from public, anon;
revoke execute on function public.get_items_lista_v2(uuid, text) from public, anon;
revoke execute on function public.guardar_lista_usuario_v2(text, text, jsonb) from public, anon;
revoke execute on function public.actualizar_lista_v2(uuid, text, jsonb) from public, anon;
revoke execute on function public.abandonar_lista(uuid, text) from public, anon;

-- Miembros de listas ---------------------------------------------------------
revoke execute on function public.compartir_lista(uuid, text, text, text) from public, anon;
revoke execute on function public.get_miembros_lista(uuid, text) from public, anon;
revoke execute on function public.actualizar_rol_miembro(uuid, text, text, text) from public, anon;
revoke execute on function public.eliminar_miembro_lista(uuid, text, text) from public, anon;

-- Busqueda de usuarios -------------------------------------------------------
-- No figura en la lista del documento, pero cumple el mismo criterio: recibe
-- p_solicitante_id y con la llave publicable deja enumerar nombre y email de los
-- usuarios. La llama app/api/[[...route]]/usuarios.ts.
revoke execute on function public.buscar_usuarios_por_email(text, text) from public, anon;

commit;

-- =============================================================================
-- Verificacion
-- =============================================================================
-- Las 15 funciones de arriba tienen que dar anon_puede = false. Las de catalogo
-- (buscar_catalogo_v2, buscar_productos_por_sucursales_v2, obtener_sucursales_cercanas,
-- buscar_precios_por_ids_sucursales) siguen en true a proposito: no reciben usuario.
--
-- select p.proname,
--        has_function_privilege('anon', p.oid, 'EXECUTE') as anon_puede
-- from pg_proc p
-- join pg_namespace n on n.oid = p.pronamespace
-- where n.nspname = 'public'
--   and not exists (select 1 from pg_depend d where d.objid = p.oid and d.deptype = 'e')
-- order by anon_puede desc, p.proname;
--
-- Si alguna de las 15 sigue en true, el revoke de esa linea no aplico: lo mas probable
-- es una firma de tipos que no coincide con la funcion real.
-- =============================================================================
