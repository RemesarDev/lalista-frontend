-- =============================================================================
-- Activar RLS en las tablas de listas y cerrar la vista que lo esquiva
-- =============================================================================
-- 011 cerro el camino por funciones. Este cierra el que queda: acceso directo por
-- tabla. anon tiene SELECT/INSERT/UPDATE/DELETE sobre estas tres tablas (Supabase
-- otorga ALL por defecto) y no tenian RLS, asi que con la llave publicable se leian y
-- modificaban las listas de cualquier usuario sin pasar por ninguna funcion:
-- un GET /rest/v1/listas?select=* las devolvia enteras.
--
-- Sin policies, RLS deniega todo a anon. Es lo buscado: el navegador no habla con
-- Supabase, ningun archivo del cliente importa el cliente de DB1. Si alguna vez hace
-- falta acceso publico (un widget, una pagina estatica), se agregan policies explicitas
-- en vez de dejar la tabla abierta.
--
-- POR QUE NO SE ROMPE NADA. Verificado contra la base:
--
--   service_role :: bypassrls=true      <- el rol que usa el servidor
--   postgres     :: bypassrls=true      <- el owner de todas las funciones
--   anon         :: bypassrls=false
--
--   * Las 6 funciones SECURITY DEFINER que tocan estas tablas corren como postgres.
--   * Las 6 SECURITY INVOKER corren como quien llama, y quien llama es service_role.
--   * El servidor no hace acceso directo por tabla a ninguna de las tres: todo pasa
--     por RPC. El unico .from() del cliente de DB1 es sobre productos, categorias,
--     producto_etiqueta y las vistas de catalogo.
--
-- NO hace falta pasar get_listas_usuario, abandonar_lista ni compartir_lista a
-- SECURITY DEFINER. Ese prerrequisito valia mientras el que llamaba era anon; ahora que
-- llama service_role desaparece, y dejarlas como INVOKER es menos privilegio.
--
-- TAMBIEN: v_productos_categorizados. Es una vista, y las vistas no tienen RLS propio:
-- corren como su owner salvo que se les ponga security_invoker. Esta quedo sin esa
-- opcion, asi que corre como postgres (bypassrls) y por lo tanto esquiva el RLS de las
-- tablas que lee. Es el motivo por el que el Security Advisor la marca UNRESTRICTED.
--
-- Hoy no expone nada de mas: debajo solo hay catalogo (productos, categorias,
-- producto_clasificacion, producto_etiqueta, etiquetas) y las cinco tienen policy de
-- SELECT publico, asi que sirve lo mismo que anon ya puede leer directo. Se corrige
-- igual por dos razones: el dia que alguien le sume un join a una tabla con RLS de
-- verdad la fuga aparece sola y en silencio, y es la unica forma de que deje de llegar
-- el mail del advisor, porque Supabase no permite silenciar lints individuales.
--
-- Las otras tres vistas del proyecto ya la tienen (v_etiquetas_disponibles,
-- v_producto_contenido, v_producto_sucursal_comercio): esto es una omision, no una
-- decision.
--
-- Queda afuera spatial_ref_sys, que el advisor marca igual. Es tabla de PostGIS, owner
-- supabase_admin, y desde el rol postgres no se puede ni activarle RLS ("must be owner
-- of table") ni revocarle permisos a anon: el revoke se acepta pero es no-op, porque el
-- grant lo hizo supabase_admin. Ese solo lo puede cerrar el soporte de Supabase.
--
-- ORDEN: correr esto DESPUES de que el deploy con SERVICE_ROLE_KEY_SUPABASE este arriba.
-- Si el servidor todavia habla con la llave publicable, activar RLS lo deja sin ver una
-- sola fila de estas tablas.
--
-- RESTO CONOCIDO: RLS no filtra TRUNCATE, y anon conserva ese privilegio sobre las tres.
-- No es alcanzable por la API REST, que no expone truncate. Si se quiere cerrar igual:
-- revoke truncate on table public.listas, public.lista_items, public.list_members from public, anon;
-- =============================================================================

begin;

-- lock_timeout para no quedar encolado: enable row level security toma un lock
-- ACCESS EXCLUSIVE sobre la tabla. Si no lo consigue, la transaccion aborta y no queda
-- nada a medio aplicar; se reintenta y listo.
set local lock_timeout = '5s';

alter table public.listas       enable row level security;
alter table public.lista_items  enable row level security;
alter table public.list_members enable row level security;

-- La vista pasa a correr con los permisos de quien la consulta. El servidor la consulta
-- con service_role (bypassrls), asi que para la app no cambia nada.
alter view public.v_productos_categorizados set (security_invoker = true);

commit;

-- =============================================================================
-- Verificacion: las tres tienen que dar rls = true y policies = 0
-- =============================================================================
select c.relname as tabla,
       c.relrowsecurity as rls,
       (select count(*) from pg_policy pol where pol.polrelid = c.oid) as policies,
       has_table_privilege('anon', c.oid, 'SELECT') as anon_tiene_grant
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname in ('listas', 'lista_items', 'list_members')
order by c.relname;

-- anon_tiene_grant sigue en true y esta bien: el grant de tabla no se toca, lo que
-- filtra es RLS. Con RLS activo y cero policies, anon no ve ni escribe ninguna fila.

-- Y la vista tiene que dar security_invoker=true
select c.relname as vista,
       coalesce(
         (select o from unnest(c.reloptions) o where o like 'security_invoker%'),
         'NO SETEADO -> corre como el owner'
       ) as opcion
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname = 'v_productos_categorizados';
