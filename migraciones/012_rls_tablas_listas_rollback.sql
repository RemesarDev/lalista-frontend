-- =============================================================================
-- ROLLBACK DE EMERGENCIA de 012_rls_tablas_listas.sql
-- =============================================================================
-- Devuelve las tres tablas al estado exacto que tenian antes de 012: RLS apagado.
-- Pegar y correr tal cual en el SQL editor de Supabase.
--
-- Cuando se usa: si despues de correr 012 las listas aparecen vacias o fallan las
-- operaciones sobre listas, items o miembros. Sintoma tipico: el servidor todavia esta
-- hablando con la llave publicable (deploy sin SERVICE_ROLE_KEY_SUPABASE, o Vercel
-- sirviendo un build anterior), asi que consulta como anon y RLS no le muestra nada.
--
-- ESTADO QUE RESTAURA (verificado contra la base antes de aplicar 012):
--
--   listas       :: rls=false :: force=false :: policies=0
--   lista_items  :: rls=false :: force=false :: policies=0
--   list_members :: rls=false :: force=false :: policies=0
--
-- Las tres estaban sin una sola policy, asi que apagar RLS alcanza: no hay nada mas que
-- reponer. 012 tampoco toca force_row_level_security ni los grants de tabla.
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
