-- =============================================================================
-- Corrige el formato de la presentacion en v_producto_contenido
--
-- El to_char con formato 'FM999999.999' dejaba el separador decimal aunque el
-- numero fuera entero: "200 g" salia como "200, g".
--
-- Se reemplaza por un cast a texto normalizado, que no agrega separadores.
-- =============================================================================

create or replace view v_producto_contenido
with (security_invoker = true) as
select
    p.id_producto,
    coalesce(pc.cantidad, p.productos_cantidad_presentacion) as cantidad,
    coalesce(pc.unidad, lower(trim(p.productos_unidad_medida_presentacion))) as unidad,
    pc.contenido_base,
    coalesce(pc.origen, 'columna') as origen,

    -- Texto listo para mostrar: "500 g", "1,5 L", "2 kg".
    -- trim_scale quita los ceros sobrantes (1.200 -> 1.2) y el replace pasa el
    -- punto a coma, que es como se escriben los decimales en Argentina.
    case
        when pc.contenido_base is null then null

        when pc.contenido_base >= 1000 and pc.unidad = 'g'
            then replace(trim_scale(pc.contenido_base / 1000)::text, '.', ',') || ' kg'

        when pc.contenido_base >= 1000 and pc.unidad = 'ml'
            then replace(trim_scale(pc.contenido_base / 1000)::text, '.', ',') || ' L'

        else replace(trim_scale(pc.contenido_base)::text, '.', ',') || ' ' || pc.unidad
    end as presentacion
from public.productos p
left join public.producto_contenido pc on pc.id_producto = p.id_producto;


-- =============================================================================
-- CONTROL
-- Ahora tiene que decir "200 g", no "200, g".
-- =============================================================================
--
-- select p.productos_descripcion, v.presentacion
-- from v_producto_contenido v
-- join productos p on p.id_producto = v.id_producto
-- where v.presentacion is not null
-- order by random() limit 20;
