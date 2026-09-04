-- =============================================================================
-- LALIsta - Contenido extraido de la descripcion
--
-- PROBLEMA:
-- El 72% del catalogo (40.572 de 56.256) llega con "1 UNI" en las columnas de
-- presentacion. Un paquete de yerba de 500 g figura como una unidad, porque el
-- contenido real esta escrito en la descripcion y no en esas columnas.
--
-- Sobre los productos de canasta con unidad "unidad", 8.887 de 15.071 (59%)
-- tienen el gramaje en el texto.
--
-- SOLUCION:
-- Un parser en Python lo extrae y lo guarda aca. Medido sobre 60 productos
-- reales al azar: 60 aciertos, incluidos los formatos pegados ("X480 GRS",
-- "VINO330CC") y los decimales ("105.6 GRS").
--
-- TABLA APARTE, NO COLUMNAS EN productos:
-- El ETL hace upsert diario sobre productos y pisaria estos valores. Es la
-- misma razon por la que la clasificacion vive en producto_clasificacion.
-- =============================================================================


create table if not exists producto_contenido (
    id_producto     text primary key references public.productos(id_producto) on delete cascade,

    -- Lo que se extrajo, tal como estaba: 2 para "X 2LT", 500 para "X 500 GRS".
    cantidad        numeric not null,

    -- Unidad canonica: g o ml. Las unidades de longitud no se extraen.
    unidad          text not null check (unidad in ('g', 'ml')),

    -- Contenido total en la unidad base (gramos o mililitros).
    -- "X 2LT" -> 2000. Es el campo que sirve para comparar y para calcular
    -- precio por kilo.
    contenido_base  numeric not null check (contenido_base > 0),

    -- texto  = se extrajo de la descripcion
    -- columna = venia en productos_cantidad_presentacion
    -- manual = lo corrigio una persona
    origen          text not null default 'texto'
                    check (origen in ('texto', 'columna', 'manual')),

    actualizado_en  timestamp with time zone default now()
);

comment on table producto_contenido is
  'Gramaje o volumen del producto. Cuando las columnas del SEPA dicen "1 UNI",
   se extrae de la descripcion.';


create index if not exists idx_producto_contenido_unidad
  on public.producto_contenido (unidad);


-- RLS: lectura publica (el frontend usa la anon key), escritura solo service role.

alter table public.producto_contenido enable row level security;

drop policy if exists "lectura publica contenido" on public.producto_contenido;
create policy "lectura publica contenido"
    on public.producto_contenido for select
    using (true);


-- VISTA PARA EL FRONTEND -------------------------------------------------------
-- Combina las dos fuentes: primero lo que ya venia en las columnas, y si no
-- sirve, lo extraido del texto.

create or replace view v_producto_contenido
with (security_invoker = true) as
select
    p.id_producto,
    coalesce(pc.cantidad, p.productos_cantidad_presentacion) as cantidad,
    coalesce(pc.unidad, lower(trim(p.productos_unidad_medida_presentacion))) as unidad,
    pc.contenido_base,
    coalesce(pc.origen, 'columna') as origen,

    -- Texto listo para mostrar: "500 g", "1,5 L", "2 kg".
    case
        when pc.contenido_base is null then null
        when pc.contenido_base >= 1000 and pc.unidad = 'g'
            then replace(trim(to_char(pc.contenido_base / 1000, 'FM999999.999')), '.', ',') || ' kg'
        when pc.contenido_base >= 1000 and pc.unidad = 'ml'
            then replace(trim(to_char(pc.contenido_base / 1000, 'FM999999.999')), '.', ',') || ' L'
        else replace(trim(to_char(pc.contenido_base, 'FM999999.999')), '.', ',') || ' ' || pc.unidad
    end as presentacion
from public.productos p
left join public.producto_contenido pc on pc.id_producto = p.id_producto;

comment on view v_producto_contenido is
  'Contenido del producto listo para mostrar, combinando las columnas del SEPA
   con lo extraido de la descripcion.';


-- =============================================================================
-- CONTROLES
-- =============================================================================

-- A) Cuantos productos quedaron con contenido.
--
-- select origen, count(*) from producto_contenido group by 1;


-- B) Como se ve la presentacion.
--
-- select p.productos_descripcion, v.presentacion
-- from v_producto_contenido v
-- join productos p on p.id_producto = v.id_producto
-- where v.presentacion is not null
-- order by random() limit 20;


-- C) Outliers: contenidos absurdos que delatan una extraccion mal hecha.
--
-- select p.productos_descripcion, pc.contenido_base, pc.unidad
-- from producto_contenido pc
-- join productos p on p.id_producto = pc.id_producto
-- where pc.contenido_base > 50000 or pc.contenido_base < 1
-- order by pc.contenido_base desc
-- limit 30;
