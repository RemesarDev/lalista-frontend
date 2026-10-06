-- =============================================================================
-- ROLLBACK DE EMERGENCIA de 011_revocar_anon.sql
-- =============================================================================
-- Devuelve las 15 funciones al estado exacto que tenian antes de 011: reponer el
-- EXECUTE a PUBLIC y a anon. Pegar y correr tal cual en el SQL editor de Supabase.
--
-- Cuando se usa: si despues de correr 011 los endpoints empiezan a devolver error de
-- permisos. Sintoma tipico: el deploy con SERVICE_ROLE_KEY_SUPABASE no esta arriba
-- todavia, o Vercel no tiene la variable y el servidor sigue hablando con la llave
-- publicable.
--
-- ESTADO QUE RESTAURA (verificado contra la base antes de aplicar 011). Las 15 tenian
-- identicamente estos cinco destinatarios, solo con privilegio EXECUTE:
--
--   PUBLIC, postgres, anon, authenticated, service_role
--
-- 011 solo saca PUBLIC y anon; postgres, authenticated y service_role no los toca, asi
-- que no hay nada que reponer ahi. Correr este archivo dos veces no hace dano: grant es
-- idempotente.
--
-- OJO: esto revierte los permisos de la base, NO el codigo. Si el problema es que el
-- servidor quedo sin la llave, el arreglo de fondo es cargar SERVICE_ROLE_KEY_SUPABASE
-- en Vercel y redeployar, o revertir el commit de app/_lib/supabase.ts. Este rollback
-- compra tiempo para hacer eso sin la app caida.
--
-- Corriendolo como postgres (lo que hace el SQL editor) el ACL queda igual al original.
-- Desde otro rol el privilegio es el mismo pero cambia quien figura como otorgante.
-- =============================================================================

begin;

-- Direcciones ----------------------------------------------------------------
grant execute on function public.actualizar_radio_direccion(uuid, text, numeric) to public, anon;
grant execute on function public.cambiar_direccion_activa(uuid, text) to public, anon;
grant execute on function public.obtener_direcciones_usuario(text) to public, anon;
grant execute on function public.agregar_direccion(text, text, double precision, double precision, integer) to public, anon;
grant execute on function public.eliminar_direccion(uuid, text) to public, anon;

-- Listas ---------------------------------------------------------------------
grant execute on function public.get_listas_usuario(text) to public, anon;
grant execute on function public.get_items_lista_v2(uuid, text) to public, anon;
grant execute on function public.guardar_lista_usuario_v2(text, text, jsonb) to public, anon;
grant execute on function public.actualizar_lista_v2(uuid, text, jsonb) to public, anon;
grant execute on function public.abandonar_lista(uuid, text) to public, anon;

-- Miembros de listas ---------------------------------------------------------
grant execute on function public.compartir_lista(uuid, text, text, text) to public, anon;
grant execute on function public.get_miembros_lista(uuid, text) to public, anon;
grant execute on function public.actualizar_rol_miembro(uuid, text, text, text) to public, anon;
grant execute on function public.eliminar_miembro_lista(uuid, text, text) to public, anon;

-- Busqueda de usuarios -------------------------------------------------------
-- La agrega 011 por fuera de la lista del documento; se repone igual que el resto.
grant execute on function public.buscar_usuarios_por_email(text, text) to public, anon;

commit;

-- =============================================================================
-- Verificacion: las 15 tienen que dar anon_puede = true
-- =============================================================================
select p.oid::regprocedure::text as funcion,
       has_function_privilege('anon', p.oid, 'EXECUTE') as anon_puede
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in (
    'actualizar_radio_direccion', 'cambiar_direccion_activa', 'obtener_direcciones_usuario',
    'agregar_direccion', 'eliminar_direccion',
    'get_listas_usuario', 'get_items_lista_v2', 'guardar_lista_usuario_v2',
    'actualizar_lista_v2', 'abandonar_lista',
    'compartir_lista', 'get_miembros_lista', 'actualizar_rol_miembro',
    'eliminar_miembro_lista', 'buscar_usuarios_por_email'
  )
order by anon_puede, funcion;
