-- =============================================================================
-- Auditoria del Gatekeeper en la base (Supabase DB1 "LALIsta")
-- =============================================================================
-- Solo lectura: ninguna consulta modifica nada. Correr en el SQL Editor de
-- Supabase y pegar los resultados en el informe.
--
-- Por que hace falta: la API del servidor usa service_role (bypassea RLS), pero
-- la URL de Supabase es publica (NEXT_PUBLIC_SUPABASE_URL) y la llave anon/
-- publishable no es un secreto por diseño (ademas, segun 011/012, el servidor
-- la uso en el pasado). Cualquier tabla o funcion que anon pueda tocar es
-- alcanzable con un curl a /rest/v1, sin pasar por Hono ni por Better Auth.
-- =============================================================================


-- -----------------------------------------------------------------------------
-- Q1. RLS y permisos de anon en TODAS las tablas de public
-- -----------------------------------------------------------------------------
-- Critico si alguna de "user", "session", "account", "verification" o
-- direcciones_usuario da rls = false Y anon_select = true:
--   * session  -> tokens de sesion de todos (incluido el admin): robo de cuenta.
--   * account  -> hashes de clave.
--   * user     -> emails y roles; con anon_update, cualquiera se pone role=admin.
-- 012 activo RLS solo en listas, lista_items y list_members.
select c.relname                                        as tabla,
       c.relrowsecurity                                 as rls,
       (select count(*) from pg_policy p where p.polrelid = c.oid) as policies,
       has_table_privilege('anon', c.oid, 'SELECT')     as anon_select,
       has_table_privilege('anon', c.oid, 'INSERT')     as anon_insert,
       has_table_privilege('anon', c.oid, 'UPDATE')     as anon_update,
       has_table_privilege('anon', c.oid, 'DELETE')     as anon_delete
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind in ('r', 'p', 'v', 'm')
order by (c.relrowsecurity is false and has_table_privilege('anon', c.oid, 'SELECT')) desc,
         c.relname;

-- Correccion si Q1 marca alguna de las tablas de Better Auth (mismo criterio
-- que 012: RLS sin policies = anon no ve ni escribe nada; service_role y el
-- pool de Better Auth (rol postgres) no se ven afectados):
--
-- begin;
-- set local lock_timeout = '5s';
-- alter table public."user"         enable row level security;
-- alter table public."session"      enable row level security;
-- alter table public."account"      enable row level security;
-- alter table public."verification" enable row level security;
-- alter table public.direcciones_usuario enable row level security;
-- revoke all on table public."user", public."session", public."account", public."verification" from anon, authenticated;
-- commit;
--
-- OJO: verificar antes con que rol conecta DATABASE_URL (Better Auth). Si es
-- "postgres" (bypassrls = true) no cambia nada. Si fuera otro rol sin
-- bypassrls, hay que darle policies o Better Auth deja de ver sus tablas:
--   select rolname, rolbypassrls from pg_roles where rolname = current_user;


-- -----------------------------------------------------------------------------
-- Q1b. Con que rol entra Better Auth (antes de correr 015)
-- -----------------------------------------------------------------------------
-- Correr con la misma cadena de DATABASE_URL (no desde el SQL editor, que
-- siempre es postgres). Tiene que dar rolbypassrls = true o ser el owner de
-- las tablas; si no, 015 deja a Better Auth sin acceso a "user"/"session".
select current_user, r.rolbypassrls,
       (select tableowner from pg_tables where schemaname = 'public' and tablename = 'session') as owner_session
from pg_roles r where r.rolname = current_user;


-- -----------------------------------------------------------------------------
-- Q2. Funciones que anon / authenticated pueden ejecutar
-- -----------------------------------------------------------------------------
-- Las que reciben p_user_id / p_owner_id / p_solicitante_id tienen que dar
-- anon_puede = false (ver 011). Las de catalogo pueden quedar en true.
-- Ojo con las SECURITY DEFINER sin search_path fijo: se pueden secuestrar
-- creando objetos con el mismo nombre en otro schema.
select p.proname                                          as funcion,
       pg_get_function_identity_arguments(p.oid)          as argumentos,
       p.prosecdef                                        as security_definer,
       coalesce(array_to_string(p.proconfig, ','), '')    as config,
       has_function_privilege('anon', p.oid, 'EXECUTE')   as anon_puede,
       -- GK-06: authenticated se consigue con /auth/v1/signup + la llave
       -- publicable. Tiene que dar false igual que anon (migracion 015).
       has_function_privilege('authenticated', p.oid, 'EXECUTE') as auth_puede
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and not exists (select 1 from pg_depend d where d.objid = p.oid and d.deptype = 'e')
order by auth_puede desc,
         anon_puede desc,
         (pg_get_function_identity_arguments(p.oid) ~ '(p_user_id|p_owner_id|p_solicitante_id)') desc,
         p.proname;


-- -----------------------------------------------------------------------------
-- Q3. Codigo de las RPC de autorizacion que NO estan en migraciones/
-- -----------------------------------------------------------------------------
-- El repo no tiene la definicion de estas funciones, y son las que deciden si
-- A puede tocar algo de B. Revisar a mano que cada una:
--   * filtre por owner_id = p_user_id (o membresia) ANTES de leer o escribir;
--   * en actualizar_lista_v2: que un "viewer" NO pueda escribir y que solo el
--     owner pueda renombrar;
--   * en abandonar_lista: que un no-miembro no borre nada;
--   * en las de direcciones: que el WHERE tenga "and user_id = p_user_id";
--   * en buscar_usuarios_por_email: que exija match exacto o un minimo de
--     caracteres, excluya al solicitante y limite la cantidad de filas.
select p.proname, pg_get_functiondef(p.oid) as definicion
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in (
    'actualizar_lista_v2', 'abandonar_lista', 'compartir_lista',
    'guardar_lista_usuario_v2', 'get_listas_usuario',
    'obtener_direcciones_usuario', 'agregar_direccion', 'cambiar_direccion_activa',
    'actualizar_radio_direccion', 'eliminar_direccion',
    'buscar_usuarios_por_email'
  )
order by p.proname;


-- -----------------------------------------------------------------------------
-- Q4. Quien tiene un rol distinto de "user"
-- -----------------------------------------------------------------------------
-- Mientras main no tenga input:false en role (hallazgo GK-01), cualquiera pudo
-- haberse puesto admin. Toda fila que no reconozcan es un incidente.
select id, email, name, role, "emailVerified", "createdAt", "updatedAt"
from "user"
where role is distinct from 'user'
order by "updatedAt" desc;


-- -----------------------------------------------------------------------------
-- Q5. Sesiones: vigentes por usuario y vencidas que siguen en la tabla
-- -----------------------------------------------------------------------------
select u.email, u.role,
       count(*) filter (where s."expiresAt" > now())  as vigentes,
       count(*) filter (where s."expiresAt" <= now()) as vencidas,
       max(s."createdAt")                             as ultima
from "session" s
join "user" u on u.id = s."userId"
group by u.email, u.role
order by vigentes desc
limit 50;


-- -----------------------------------------------------------------------------
-- Q6. Cuentas sin verificar de mas de 24 h (hallazgo GK-12)
-- -----------------------------------------------------------------------------
-- Son las que alguien pudo registrar con el email de otro. Candidatas a purga.
select id, email, name, "createdAt"
from "user"
where "emailVerified" = false
  and "createdAt" < now() - interval '24 hours'
order by "createdAt";


-- -----------------------------------------------------------------------------
-- Q7. Cuentas con baja programada que todavia tienen sesiones
-- -----------------------------------------------------------------------------
-- Antes del fix de beforeDelete esto podia dar filas: pedir la baja no cortaba
-- las sesiones de otros dispositivos.
select u.email, u."deletionScheduledAt", count(s.id) as sesiones
from "user" u
join "session" s on s."userId" = u.id and s."expiresAt" > now()
where u."deletionScheduledAt" is not null
group by u.email, u."deletionScheduledAt";


-- -----------------------------------------------------------------------------
-- Q8. Usuarios creados por Supabase Auth (GoTrue) (hallazgo GK-06)
-- -----------------------------------------------------------------------------
-- La app no usa Supabase Auth: cualquier fila aca es alguien que uso la llave
-- publicable para conseguir un JWT "authenticated". Con 011 + 015 ese JWT ya
-- no ejecuta las RPC de usuario, pero cada fila es un indicio de ataque.
select id, email, created_at, last_sign_in_at, raw_app_meta_data->>'provider' as provider
from auth.users
order by created_at desc
limit 50;


-- =============================================================================
-- DB2 (LALIstaAnaliticas) - correr en ESE proyecto, no en LALIsta
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Q9. Tokens de reset/verificacion guardados en analiticas (hallazgo GK-02)
-- -----------------------------------------------------------------------------
-- AnalyticsTracker guardaba /restablecer-contrasena?token=... en cada page
-- view. Cualquier fila con token de menos de 1 h es un token que todavia puede
-- funcionar si el dueño no termino el cambio de clave.
select created_at, user_id, event_name, metadata->>'path' as path
from analytics_events
where metadata::text ~* '([?&](token|code|otp)=[^&"]{8,}|/reset-password/[^/?"]{8,})'
  and metadata::text !~* '=REDACTADO'
order by created_at desc
limit 100;

-- Correccion (despues de deployar la redaccion de GK-02). Reescribe la
-- metadata de las filas afectadas reemplazando el valor del token:
--
-- begin;
-- update analytics_events
-- set metadata = regexp_replace(
--       regexp_replace(metadata::text,
--         '([?&](token|code|otp|password|secret|key|signature|sig|access_token|refresh_token|id_token)=)[^&#"\\ ]*',
--         '\1REDACTADO', 'gi'),
--       '(/reset-password/)[^/?#"\\ ]+', '\1REDACTADO', 'gi')::jsonb
-- where metadata::text ~* '([?&](token|code|otp|password|secret|key|signature|sig|access_token|refresh_token|id_token)=|/reset-password/)'
--   and metadata::text !~* '=REDACTADO';
-- commit;


-- -----------------------------------------------------------------------------
-- Q10. RLS y grants en DB2 (support_messages tiene nombre, email y mensaje)
-- -----------------------------------------------------------------------------
select c.relname as tabla,
       c.relrowsecurity as rls,
       (select count(*) from pg_policy p where p.polrelid = c.oid) as policies,
       has_table_privilege('anon', c.oid, 'SELECT')          as anon_select,
       has_table_privilege('anon', c.oid, 'INSERT')          as anon_insert,
       has_table_privilege('authenticated', c.oid, 'SELECT') as auth_select
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind = 'r'
order by rls, c.relname;

-- El bucket de backups no puede ser publico:
select id, name, public from storage.buckets;
