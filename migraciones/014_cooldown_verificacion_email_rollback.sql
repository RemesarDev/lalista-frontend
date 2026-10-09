-- =============================================================================
-- ROLLBACK de 014_cooldown_verificacion_email.sql
-- =============================================================================
-- Borra "verificationEmailSentAt" de "user". Si el codigo del cooldown ya
-- esta deployado y lee/escribe esta columna, hacer este rollback primero
-- rompe ese codigo -- sacar el deploy que la usa antes de correr esto.
--
-- Correr este archivo dos veces no hace dano (IF EXISTS).
-- =============================================================================

begin;

alter table "user"
  drop column if exists "verificationEmailSentAt";

commit;
