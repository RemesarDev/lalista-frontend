-- =============================================================================
-- ROLLBACK de 013_items_lista_con_nombre.sql
-- =============================================================================
-- Borra get_items_lista_v3. get_items_lista_v2 no se toco, asi que no hay nada
-- que reponer.
--
-- ORDEN: primero volver el front a la version que llama a get_items_lista_v2
-- (app/api/[[...route]]/listas.ts, endpoint GET /listas/:id/items). Si se borra
-- v3 con el front nuevo en produccion, compartir y abrir listas fallan.
--
-- Correr este archivo dos veces no hace dano.
-- =============================================================================

drop function if exists public.get_items_lista_v3(uuid, text);
