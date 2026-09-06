-- =============================================================================
-- LALIsta - Filtros por categoria y etiquetas dietarias
-- Reemplaza a las migraciones 004 y 005, que estaban escritas sobre las
-- funciones anteriores al trabajo de busqueda por similitud.
--
-- Requiere 001_categorias.sql.
--
-- QUE CAMBIA:
-- Se agregan dos parametros opcionales a las dos funciones que usa el buscador:
--   p_categoria_slug  -> filtra por rubro O por categoria
--   p_etiquetas       -> filtra por etiquetas dietarias
--
-- Ambos con DEFAULT NULL al final de la firma, asi que TODAS las llamadas
-- actuales del frontend siguen funcionando sin cambios.
--
-- QUE NO CAMBIA:
-- El orden de relevancia (prioridad_match + similarity), la paginacion, el
-- formato de salida y la estructura de CTEs quedan exactamente igual. El filtro
-- se agrega DENTRO de productos_filtrados, que es donde ya se filtra por texto,
-- para no alterar el plan de ejecucion ni desaprovechar el indice trigram.
--
-- UN SOLO PARAMETRO PARA RUBRO Y CATEGORIA:
-- Si llega 'alimentos' (un rubro) devuelve todo lo que cuelga de el. Si llega
-- 'lacteos', solo esa categoria. Se resuelve comparando contra el slug propio
-- y contra el del padre.
--
-- ETIQUETAS: SOLO LAS DECLARADAS
-- producto_etiqueta guarda el origen de cada etiqueta ('keyword' cuando la
-- descripcion lo dice, 'ia' cuando lo dedujo el modelo). El filtro usa solo las
-- declaradas: que la IA infiera que un arroz no lleva gluten es correcto como
-- razonamiento, pero no es una declaracion del fabricante, y para alguien
-- celiaco esa diferencia importa.
-- =============================================================================


-- 1. INDICE DE APOYO -----------------------------------------------------------

create index if not exists idx_producto_etiqueta_declarada
  on public.producto_etiqueta (etiqueta_id)
  where origen in ('keyword', 'manual');


-- 2. VISTA DE CONTEOS ----------------------------------------------------------
-- El frontend la usa para decidir que filtros ofrecer: los que tienen pocos
-- productos dejan la pantalla vacia y confunden mas de lo que ayudan.

create or replace view v_etiquetas_disponibles
with (security_invoker = true) as
select
    e.codigo,
    e.nombre,
    count(pe.id_producto) filter (where pe.origen in ('keyword', 'manual')) as productos
from public.etiquetas e
left join public.producto_etiqueta pe on pe.etiqueta_id = e.id
group by e.id, e.codigo, e.nombre
order by 3 desc;

comment on view v_etiquetas_disponibles is
  'Productos por etiqueta, contando solo los que lo declaran en la descripcion.';


-- 3. BUSCADOR POR SUCURSALES ---------------------------------------------------
-- Es la que usa el buscador cuando el usuario tiene ubicacion puesta.

drop function if exists public.buscar_productos_por_sucursales(
  text[], text, integer, integer
);

CREATE OR REPLACE FUNCTION public.buscar_productos_por_sucursales(
  p_sucursales_ids text[],
  search_term text DEFAULT NULL::text,
  p_limit integer DEFAULT 20,
  p_offset integer DEFAULT 0,
  p_categoria_slug text DEFAULT NULL::text,
  p_etiquetas text[] DEFAULT NULL::text[]
)
RETURNS TABLE(
  id_producto text,
  productos_descripcion text,
  url_imagen text,
  sucursales_json jsonb
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public', 'extensions', 'pg_catalog'
AS $function$
DECLARE
  term_clean text;
  term_array text[];
  cant_etiquetas integer;
BEGIN
  IF search_term IS NOT NULL AND trim(search_term) != '' THEN
    term_clean := lower(trim(search_term));
    SELECT array_agg('%' || val || '%')
    INTO term_array
    FROM unnest(string_to_array(regexp_replace(term_clean, '\s+', ' ', 'g'), ' ')) AS val;
  END IF;

  -- Cuantas etiquetas pidio el usuario. Se exige que el producto las cumpla
  -- TODAS: alguien celiaco y diabetico necesita las dos, no cualquiera.
  cant_etiquetas := coalesce(array_length(p_etiquetas, 1), 0);

  RETURN QUERY
  WITH
  sucursales_cercanas AS (
    SELECT s.id_unico, s.id_comercio, s.id_bandera, s.sucursales_calle, s.sucursales_numero
    FROM public.sucursales s
    WHERE s.id_unico = ANY(p_sucursales_ids)
  ),
  productos_filtrados AS (
    SELECT
      p.id_producto,
      p.productos_descripcion,
      p.url_imagen,
      CASE
        WHEN term_clean IS NOT NULL AND lower(p.productos_descripcion) LIKE term_clean || '%' THEN 0
        WHEN term_clean IS NOT NULL AND lower(p.productos_descripcion) LIKE '% ' || term_clean || '%' THEN 1
        ELSE 2
      END AS prioridad_match,
      CASE
        WHEN term_clean IS NOT NULL THEN similarity(p.productos_descripcion, term_clean)
        ELSE 0
      END AS score_similitud
    FROM public.productos p
    -- LEFT JOIN a proposito: un producto sin clasificar sigue apareciendo en
    -- las busquedas que no filtran por categoria.
    LEFT JOIN public.producto_clasificacion pc ON pc.id_producto = p.id_producto
    LEFT JOIN public.categorias cat ON cat.id = pc.categoria_id
    LEFT JOIN public.categorias rub ON rub.id = cat.categoria_padre_id
    WHERE (
        term_array IS NULL
        OR (
          p.productos_descripcion ILIKE term_array[1]
          AND NOT EXISTS (
            SELECT 1 FROM unnest(term_array[2:]) AS t
            WHERE p.productos_descripcion NOT ILIKE t
          )
        )
      )
      AND (
        p_categoria_slug IS NULL
        OR cat.slug = p_categoria_slug   -- coincide la categoria
        OR rub.slug = p_categoria_slug   -- o el rubro que la contiene
      )
      AND (
        cant_etiquetas = 0
        OR (
          SELECT count(DISTINCT e.codigo)
          FROM public.producto_etiqueta pe
          JOIN public.etiquetas e ON e.id = pe.etiqueta_id
          WHERE pe.id_producto = p.id_producto
            AND e.codigo = ANY(p_etiquetas)
            AND pe.origen IN ('keyword', 'manual')
        ) = cant_etiquetas
      )
  ),
  productos_en_zona AS (
    SELECT DISTINCT ON (pf.id_producto)
      pf.id_producto,
      pf.productos_descripcion,
      pf.url_imagen,
      pf.prioridad_match,
      pf.score_similitud
    FROM productos_filtrados pf
    JOIN public.sucursal_productos sp ON sp.id_producto = pf.id_producto
    JOIN sucursales_cercanas sc ON sc.id_unico = sp.sucursal_id_relacion
    ORDER BY pf.id_producto
  ),
  productos_paginados AS (
    SELECT pez.*
    FROM productos_en_zona pez
    ORDER BY
      pez.prioridad_match ASC,
      pez.score_similitud DESC,
      pez.productos_descripcion ASC,
      pez.id_producto ASC
    LIMIT p_limit
    OFFSET p_offset
  )
  SELECT
    pp.id_producto::text,
    pp.productos_descripcion::text,
    pp.url_imagen::text,
    coalesce(
      jsonb_agg(
        jsonb_build_object(
          'id_comercio', sc.id_comercio,
          'id_bandera', sc.id_bandera,
          'cadena', c.comercio_bandera_nombre,
          'direccion', trim(concat(sc.sucursales_calle, ' ', sc.sucursales_numero)),
          'precio', sp.productos_precio_lista
        ) ORDER BY sp.productos_precio_lista ASC
      ), '[]'::jsonb
    ) AS sucursales_json
  FROM productos_paginados pp
  JOIN public.sucursal_productos sp ON sp.id_producto = pp.id_producto
  JOIN sucursales_cercanas sc ON sc.id_unico = sp.sucursal_id_relacion
  JOIN public.comercios c ON c.id_comercio = sc.id_comercio AND c.id_bandera = sc.id_bandera
  GROUP BY pp.id_producto, pp.productos_descripcion, pp.url_imagen, pp.prioridad_match, pp.score_similitud
  ORDER BY
    pp.prioridad_match ASC,
    pp.score_similitud DESC,
    pp.productos_descripcion ASC,
    pp.id_producto ASC;
END;
$function$;


-- 4. BUSCADOR DE CATALOGO ------------------------------------------------------
-- La que usa el buscador cuando no hay ubicacion.

drop function if exists public.buscar_catalogo(text, integer, integer);

CREATE OR REPLACE FUNCTION public.buscar_catalogo(
  search_term text DEFAULT NULL::text,
  p_limit integer DEFAULT 20,
  p_offset integer DEFAULT 0,
  p_categoria_slug text DEFAULT NULL::text,
  p_etiquetas text[] DEFAULT NULL::text[]
)
RETURNS TABLE(id_producto text, productos_descripcion text, url_imagen text)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public', 'extensions', 'pg_catalog'
AS $function$
DECLARE
  term_clean text;
  term_array text[];
  cant_etiquetas integer;
BEGIN
  IF search_term IS NOT NULL AND trim(search_term) != '' THEN
    term_clean := lower(trim(search_term));
    SELECT array_agg('%' || val || '%')
    INTO term_array
    FROM unnest(string_to_array(regexp_replace(term_clean, '\s+', ' ', 'g'), ' ')) AS val;
  END IF;

  cant_etiquetas := coalesce(array_length(p_etiquetas, 1), 0);

  RETURN QUERY
  WITH
  productos_filtrados AS (
    SELECT
      p.id_producto,
      p.productos_descripcion,
      p.url_imagen,
      CASE
        WHEN term_clean IS NOT NULL AND lower(p.productos_descripcion) LIKE term_clean || '%' THEN 0
        WHEN term_clean IS NOT NULL AND lower(p.productos_descripcion) LIKE '% ' || term_clean || '%' THEN 1
        ELSE 2
      END AS prioridad_match,
      CASE
        WHEN term_clean IS NOT NULL THEN similarity(p.productos_descripcion, term_clean)
        ELSE 0
      END AS score_similitud
    FROM public.productos p
    LEFT JOIN public.producto_clasificacion pc ON pc.id_producto = p.id_producto
    LEFT JOIN public.categorias cat ON cat.id = pc.categoria_id
    LEFT JOIN public.categorias rub ON rub.id = cat.categoria_padre_id
    WHERE (
        term_array IS NULL
        OR (
          p.productos_descripcion ILIKE term_array[1]
          AND NOT EXISTS (
            SELECT 1 FROM unnest(term_array[2:]) AS t
            WHERE p.productos_descripcion NOT ILIKE t
          )
        )
      )
      AND (
        p_categoria_slug IS NULL
        OR cat.slug = p_categoria_slug
        OR rub.slug = p_categoria_slug
      )
      AND (
        cant_etiquetas = 0
        OR (
          SELECT count(DISTINCT e.codigo)
          FROM public.producto_etiqueta pe
          JOIN public.etiquetas e ON e.id = pe.etiqueta_id
          WHERE pe.id_producto = p.id_producto
            AND e.codigo = ANY(p_etiquetas)
            AND pe.origen IN ('keyword', 'manual')
        ) = cant_etiquetas
      )
  )
  SELECT
    pf.id_producto::text,
    pf.productos_descripcion::text,
    pf.url_imagen::text
  FROM productos_filtrados pf
  ORDER BY
    pf.prioridad_match ASC,
    pf.score_similitud DESC,
    pf.productos_descripcion ASC,
    pf.id_producto ASC
  LIMIT p_limit
  OFFSET p_offset;
END;
$function$;


-- =============================================================================
-- CONTROLES
-- =============================================================================

-- A) Las dos funciones deben mostrar p_categoria_slug y p_etiquetas.
--
-- select proname, pg_get_function_arguments(p.oid) as argumentos
-- from pg_proc p join pg_namespace n on n.oid = p.pronamespace
-- where n.nspname = 'public' and proname like 'buscar%' order by 1;


-- B) RETROCOMPATIBILIDAD: sin filtros tiene que devolver lo mismo que antes,
--    y en el mismo orden. Es el control mas importante.
--
-- select id_producto, productos_descripcion
-- from buscar_catalogo('leche', 20, 0);


-- C) Filtrando por categoria.
--
-- select count(*) from buscar_catalogo(null, 1000, 0, 'lacteos');


-- D) Filtrando por rubro: tiene que traer varias categorias, no una sola.
--
-- select v.categoria, count(*)
-- from buscar_catalogo(null, 500, 0, 'alimentos') b
-- join v_productos_categorizados v on v.id_producto = b.id_producto
-- group by 1 order by 2 desc;


-- E) Etiquetas: combinar dos exige ambas, asi que da menos que cada una sola.
--
-- select
--   (select count(*) from buscar_catalogo(null, 2000, 0, null, array['SIN_TACC'])) as tacc,
--   (select count(*) from buscar_catalogo(null, 2000, 0, null, array['DIET'])) as diet,
--   (select count(*) from buscar_catalogo(null, 2000, 0, null, array['SIN_TACC','DIET'])) as ambas;


-- F) Los conteos que va a usar el frontend.
--
-- select * from v_etiquetas_disponibles;


-- G) RENDIMIENTO: comparar sin filtros contra la version anterior.
--    Correr tres veces y quedarse con la tercera.
--
-- explain analyze select * from buscar_catalogo('leche', 20, 0);
