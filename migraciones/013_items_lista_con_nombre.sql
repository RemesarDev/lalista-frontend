-- =============================================================================
-- LALIsta - Items de una lista junto con el nombre de la lista
-- =============================================================================
-- Backlog: "En compartir no están las cantidades alternativas. No están los
-- nombres de las listas. No está definido el principal".
--
-- QUE SE ENCONTRO (definiciones leidas de la base el 2026-10-08):
--   * guardar_lista_usuario_v2 y actualizar_lista_v2 YA guardan es_principal,
--     cantidad_opcion y nombre_personalizado en lista_items.
--   * get_items_lista_v2 YA los devuelve. Lo que fallaba era el texto de
--     "Compartir contenido", que no los usaba (arreglado en el front).
--   * Lo unico que esa consulta no trae es el nombre de la lista. El front lo
--     tomaba de otro lado: en Mis listas de get_listas_usuario y en Mi lista del
--     estado local, que puede tener un nombre cambiado y todavia sin sincronizar.
--
-- SOLUCION:
--   get_items_lista_v3 = get_items_lista_v2 + la columna lista_nombre, para que
--   el texto que se comparte salga entero de una sola consulta a la base.
--   Mismo filtro de acceso (owner o miembro) y mismo orden que v2.
--
--   Se crea una funcion nueva en vez de modificar v2 porque cambiar las columnas
--   que devuelve una funcion obliga a borrarla y recrearla. Asi v2 sigue andando
--   hasta que se deploye el front que llama a v3, y el rollback es borrar v3.
--   Cuando el front nuevo este en produccion, v2 queda sin uso y se puede borrar
--   en otra migracion.
--
-- PERMISOS: una funcion nueva nace con EXECUTE para PUBLIC, que alcanza a anon
-- (ver 011). Se revoca igual que alli; service_role, que es el que usa el
-- servidor, conserva el permiso.
--
-- ORDEN: correr esto ANTES de deployar el front que llama a get_items_lista_v3.
-- Al reves, compartir y abrir listas fallan hasta que corra la migracion.
--
-- DONDE: en el proyecto de Supabase que tiene lista_items (LALIsta), no en
-- LALIstaMensual.
--
-- Correr este archivo dos veces no hace dano.
-- =============================================================================

begin;

create or replace function public.get_items_lista_v3(p_list_id uuid, p_user_id text)
returns table(
  grupo_id uuid,
  id_producto text,
  descripcion text,
  imagen text,
  cantidad integer,
  comprado boolean,
  es_principal boolean,
  cantidad_opcion integer,
  nombre_personalizado text,
  lista_nombre text
)
language sql
stable security definer
set search_path to 'public'
as $function$
  select
    li.grupo_id,
    li.id_producto,
    p.productos_descripcion as descripcion,
    p.url_imagen as imagen,
    li.cantidad,
    li.comprado,
    li.es_principal,
    coalesce(li.cantidad_opcion, 1) as cantidad_opcion,
    li.nombre_personalizado,
    l.nombre as lista_nombre
  from public.lista_items li
  inner join public.listas l on l.id = li.list_id
  inner join public.productos p on p.id_producto = li.id_producto
  where li.list_id = p_list_id
  and exists (
    select 1 from public.listas l2
    where l2.id = p_list_id and l2.owner_id = p_user_id
    union
    select 1 from public.list_members lm
    where lm.list_id = p_list_id and lm.user_id = p_user_id
  )
  order by li.created_at asc;
$function$;

revoke execute on function public.get_items_lista_v3(uuid, text) from public, anon;
grant execute on function public.get_items_lista_v3(uuid, text) to service_role;

commit;

-- =============================================================================
-- Verificacion
-- =============================================================================
-- A) anon no la puede llamar (tiene que dar false) y service_role si (true).
--
-- select has_function_privilege('anon', 'public.get_items_lista_v3(uuid, text)', 'EXECUTE') as anon_puede,
--        has_function_privilege('service_role', 'public.get_items_lista_v3(uuid, text)', 'EXECUTE') as server_puede;
--
-- B) v3 devuelve las mismas filas que v2, mas el nombre. Reemplazar los dos
--    valores por una lista y su owner reales (tabla listas, columnas id y owner_id).
--
-- select (select count(*) from get_items_lista_v2('<id_lista>', '<owner_id>')) as filas_v2,
--        (select count(*) from get_items_lista_v3('<id_lista>', '<owner_id>')) as filas_v3,
--        (select distinct lista_nombre from get_items_lista_v3('<id_lista>', '<owner_id>')) as nombre;
--
-- C) Alguien que no es owner ni miembro no ve nada (tiene que dar 0).
--
-- select count(*) from get_items_lista_v3('<id_lista>', 'usuario-que-no-existe');
-- =============================================================================
