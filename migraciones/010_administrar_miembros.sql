-- =============================================================================
-- Administracion de miembros de listas
-- =============================================================================

CREATE OR REPLACE FUNCTION public.get_miembros_lista(
  p_list_id uuid,
  p_owner_id text
)
RETURNS TABLE(
  id text,
  nombre text,
  email text,
  imagen text,
  rol text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT
    u.id,
    u.name AS nombre,
    u.email,
    u.image AS imagen,
    'owner'::text AS rol
  FROM public.listas l
  INNER JOIN public."user" u ON u.id = l.owner_id
  WHERE l.id = p_list_id
    AND l.owner_id = p_owner_id

  UNION ALL

  SELECT
    u.id,
    u.name AS nombre,
    u.email,
    u.image AS imagen,
    lm.role AS rol
  FROM public.list_members lm
  INNER JOIN public."user" u ON u.id = lm.user_id
  INNER JOIN public.listas l ON l.id = lm.list_id
  WHERE lm.list_id = p_list_id
    AND l.owner_id = p_owner_id
  ORDER BY rol, nombre;
$function$;

CREATE OR REPLACE FUNCTION public.actualizar_rol_miembro(
  p_list_id uuid,
  p_owner_id text,
  p_user_id text,
  p_rol text
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.listas
    WHERE id = p_list_id
      AND owner_id = p_owner_id
  ) THEN
    RETURN 'not_owner';
  END IF;

  IF p_rol NOT IN ('viewer', 'editor') THEN
    RETURN 'invalid_role';
  END IF;

  UPDATE public.list_members
  SET role = p_rol
  WHERE list_id = p_list_id
    AND user_id = p_user_id;

  IF NOT FOUND THEN
    RETURN 'not_found';
  END IF;

  RETURN 'ok';
END;
$function$;

CREATE OR REPLACE FUNCTION public.eliminar_miembro_lista(
  p_list_id uuid,
  p_owner_id text,
  p_user_id text
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.listas
    WHERE id = p_list_id
      AND owner_id = p_owner_id
  ) THEN
    RETURN 'not_owner';
  END IF;

  DELETE FROM public.list_members
  WHERE list_id = p_list_id
    AND user_id = p_user_id;

  IF NOT FOUND THEN
    RETURN 'not_found';
  END IF;

  RETURN 'ok';
END;
$function$;