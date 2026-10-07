-- =============================================================================
-- ROLLBACK DE EMERGENCIA de 012_rls_tablas_listas.sql
-- =============================================================================
-- Devuelve las tres tablas y la vista al estado exacto que tenian antes de 012.
-- Pegar y correr tal cual en el SQL editor de Supabase.
--
-- Cuando se usa: si despues de correr 012 las listas aparecen vacias o fallan las
-- operaciones sobre listas, items o miembros. Sintoma tipico: el servidor todavia esta
-- hablando con la llave publicable (deploy sin SERVICE_ROLE_KEY_SUPABASE, o Vercel
-- sirviendo un build anterior), asi que consulta como anon y RLS no le muestra nada.
--
-- ESTADO QUE RESTAURA (verificado contra la base antes de aplicar 012):
--
--   listas                    :: rls=false :: force=false :: policies=0
--   lista_items               :: rls=false :: force=false :: policies=0
--   list_members              :: rls=false :: force=false :: policies=0
--   v_productos_categorizados :: security_invoker SIN SETEAR
--
-- Las tres tablas estaban sin una sola policy, asi que apagar RLS alcanza: no hay nada
-- mas que reponer. 012 tampoco toca force_row_level_security ni los grants de tabla.
--
-- Para la vista va RESET y no SET (security_invoker = false). Los dos dejan la vista
-- corriendo como su owner, pero el original no tenia la opcion puesta: SET dejaria una
-- opcion explicita que antes no estaba y RESET la saca, que es el estado exacto.
--
-- Correr este archivo dos veces no hace dano.
--
-- OJO: esto reabre el acceso directo por tabla con la llave publicable. Es un parche
-- para no tener la app caida, no un estado donde quedarse. El arreglo de fondo es que el
-- servidor use service_role y volver a aplicar 012.
-- =============================================================================

begin;

set local lock_timeout = '5s';

alter table public.listas       disable row level security;
alter table public.lista_items  disable row level security;
alter table public.list_members disable row level security;

alter view public.v_productos_categorizados reset (security_invoker);

commit;

-- =============================================================================
-- Verificacion: las tres tienen que dar rls = false
-- =============================================================================
select c.relname as tabla,
       c.relrowsecurity as rls,
       c.relforcerowsecurity as force_rls,
       (select count(*) from pg_policy pol where pol.polrelid = c.oid) as policies
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname in ('listas', 'lista_items', 'list_members')
order by c.relname;

-- Y la vista tiene que volver a quedar sin la opcion
select c.relname as vista,
       coalesce(
         (select o from unnest(c.reloptions) o where o like 'security_invoker%'),
         'NO SETEADO -> corre como el owner'
       ) as opcion
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname = 'v_productos_categorizados';
