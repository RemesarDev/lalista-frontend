-- =============================================================================
-- LALIsta - Cooldown para reenvio del mail de verificacion de cuenta
-- =============================================================================
-- Contexto: con requireEmailVerification activo (ver app/_lib/auth.ts), el
-- plan es permitir reenviar el mail de verificacion -- automatico en cada
-- intento de login sin verificar (sendOnSignIn) y/o con un boton manual en el
-- front. Sin un cooldown por cuenta, cualquiera puede poner el email de un
-- tercero una y otra vez y bombardearle la casilla -- no es solo un tema de
-- costo de envio, es un vector de harassment.
--
-- QUE SE ENCONTRO (definiciones leidas de la base el 2026-10-09):
--   "user" ya tiene columnas agregadas a mano fuera del generador de
--   better-auth (role, deletionScheduledAt), con el mismo estilo de
--   identificador entre comillas en camelCase que usa better-auth.
--
-- SOLUCION:
--   Agrega "verificationEmailSentAt" (timestamptz, nullable, sin default) a
--   "user". NULL significa "nunca se le mando un mail de verificacion
--   todavia". La logica del cooldown (leer esta columna, comparar contra
--   ahora, no mandar si paso menos de N segundos) va en el callback
--   sendVerificationEmail de app/_lib/auth.ts -- esta migracion solo agrega
--   el storage, no implementa el cooldown.
--
-- PERMISOS: ninguno nuevo. Es una columna en una tabla existente con RLS sin
-- policies (ver 011/012); el servidor sigue entrando por service_role, que
-- bypasea RLS igual que antes.
--
-- ORDEN: sin restricciones. Es aditiva, nullable y nada la lee todavia -- se
-- puede correr en cualquier momento, antes o despues de deployar el codigo
-- que la use.
--
-- DONDE: en el proyecto de Supabase que tiene "user" (LALIsta), no en
-- LALIstaMensual.
--
-- Correr este archivo dos veces no hace dano (IF NOT EXISTS).
-- =============================================================================

begin;

alter table "user"
  add column if not exists "verificationEmailSentAt" timestamptz;

commit;

-- =============================================================================
-- Verificacion
-- =============================================================================
-- La columna existe y es nullable:
--
-- select column_name, data_type, is_nullable
-- from information_schema.columns
-- where table_name = 'user' and column_name = 'verificationEmailSentAt';
-- =============================================================================
