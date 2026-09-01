-- =============================================================================
-- LALIsta - Priorizar productos de canasta en los resultados
-- Requiere 006_filtros_categoria.sql.
--
-- PROBLEMA DETECTADO EN PRUEBAS CON USUARIOS:
-- Al buscar "aceite" aparecian primero lubricantes de auto, aromatizantes y
-- productos de ferreteria, antes que el aceite de cocina.
--
-- La causa: el orden mira solo el texto. "ACEITE MOTOR" empieza con "aceite"
-- igual que "ACEITE GIRASOL", asi que quedan empatados y desempata el
-- alfabetico.
--
-- SOLUCION:
-- Se agrega es_canasta como criterio de desempate, DESPUES de la prioridad por
-- texto y la similitud. Entre dos productos que coinciden igual de bien con lo
-- buscado, primero va el de supermercado.
--
-- NO OCULTA NADA: el aceite de auto sigue apareciendo, mas abajo. Se respeta
-- la decision de mostrar todo el catalogo.
--
-- LO QUE NO RESUELVE:
-- El caso "huevo" es distinto: ahi los juguetes y chocolates estaban mal
-- clasificados, todos dentro de Almacen con es_canasta = true. Ningun criterio
-- de orden los separa. Eso se corrige en clasificador.py (ver EXCEPCIONES) y
-- reprocesando esos productos.
-- =============================================================================


-- 1. BUSCADOR POR SUCURSALES ---------------------------------------------------

drop function if exists public.buscar_productos_por_sucursales(
  text[], text, integer, integer, text, text[]
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
      END AS score_similitud,
      -- Mercaderia de supermercado primero cuando el texto empata.
      -- coalesce en true: un producto sin clasificar no queda relegado.
      coalesce(rub.es_canasta, cat.es_canasta, true) AS es_canasta
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
  ),
  productos_en_zona AS (
    SELECT DISTINCT ON (pf.id_producto)
      pf.id_producto,
      pf.productos_descripcion,
      pf.url_imagen,
      pf.prioridad_match,
      pf.score_similitud,
      pf.es_canasta
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
      pez.es_canasta DESC,          -- <-- NUEVO: canasta primero
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
  GROUP BY pp.id_producto, pp.productos_descripcion, pp.url_imagen,
           pp.prioridad_match, pp.score_similitud, pp.es_canasta
  ORDER BY
    pp.prioridad_match ASC,
    pp.es_canasta DESC,             -- <-- NUEVO
    pp.score_similitud DESC,
    pp.productos_descripcion ASC,
    pp.id_producto ASC;
END;
$function$;


-- 2. BUSCADOR DE CATALOGO ------------------------------------------------------

drop function if exists public.buscar_catalogo(text, integer, integer, text, text[]);

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
      END AS score_similitud,
      coalesce(rub.es_canasta, cat.es_canasta, true) AS es_canasta
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
    pf.es_canasta DESC,             -- <-- NUEVO: canasta primero
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

-- A) EL CASO QUE MOTIVO EL CAMBIO. Los primeros tienen que ser de cocina.
--
-- select b.productos_descripcion, v.categoria, v.es_canasta
-- from buscar_catalogo('aceite', 20, 0) b
-- join v_productos_categorizados v on v.id_producto = b.id_producto;


-- B) Que no se haya roto una busqueda comun.
--
-- select id_producto, productos_descripcion from buscar_catalogo('leche', 20, 0);


-- C) Rendimiento: no deberia moverse. Correr tres veces.
--
-- explain analyze select * from buscar_catalogo('aceite', 20, 0);
