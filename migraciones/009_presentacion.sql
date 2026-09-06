-- =============================================================================
-- LALIsta - Presentacion del producto (gramaje / volumen)
--
-- Reemplaza la vista creada en 008_contenido_producto.sql para que ademas de
-- lo extraido de la descripcion use las columnas del SEPA.
--
-- POR QUE:
-- La vista anterior mostraba la presentacion solo cuando el dato se habia
-- extraido del texto. Pero 17.495 productos ya traen la medida en las columnas:
--
--   "GASEOSA COLA PET, COCA COLA, 1000 cm3"   -> 1000 / cm3
--   "Gase Coca Cola Light 2.5 Lt"             -> 2.5 / Lt
--
-- Para esos no hace falta extraer nada, pero quedaban en null y la ficha no
-- mostraba la fila. Se estaba ocultando informacion existente.
--
-- Con este cambio la cobertura pasa de 3.752 a 21.247 productos.
--
--
-- TRES PROBLEMAS DE LOS DATOS QUE HAY QUE CORREGIR AL VUELO:
--
-- 1. Decimal sin coma. El SEPA a veces omite la coma:
--       "MANAOS COLA 225L"  -> 225 con unidad L -> daria 225 litros
--    Se detecta porque el resultado pasa de 20 litros / 20 kilos, que ningun
--    producto de gondola alcanza. Se reinterpreta como 2,25 L.
--
-- 2. El caso inverso. El ETL guarda el valor en la unidad grande pero deja la
--    unidad chica:
--       "vino PADRILLOS rose 750cc"  -> 0.75 con unidad "ml." -> "0,75 ml"
--    Se reconocen porque son menores a 1 con unidad chica: no existe un
--    producto de 0,75 mililitros. Este error viene del ETL y conviene
--    reportarlo: afecta a cualquier consulta que use esas columnas.
--
-- 3. Capacidad en vez de contenido. En Electro, Bazar, Ferreteria y similares
--    los numeros con unidad son otra cosa:
--       "EXPRIMIDOR MANDINE MCJ50 24L"   -> codigo de modelo
--       "HELADERA NF LG 335L"            -> volumen interno
--       "BANERA PLASTICA DE 24 LITROS"   -> capacidad del envase
--    Esas categorias se excluyen, con el mismo criterio que usa
--    cargar_contenido.py al extraer de la descripcion.
--
--
-- ANTES DE CORRER ESTO, limpiar lo que quedo de cargas anteriores del script,
-- cuando todavia no excluia esas categorias ni tenia el tope:
--
--   delete from producto_contenido pc
--   using v_productos_categorizados v
--   where v.id_producto = pc.id_producto
--     and v.categoria_slug in ('electro','bazar','ferreteria','automotor',
--                              'jugueteria','bebes','jardin','pintureria',
--                              'libreria','indumentaria','textil-hogar');
--
--   delete from producto_contenido where contenido_base > 20000;
--
-- Sin eso, los valores viejos siguen apareciendo: el coalesce le da prioridad
-- a producto_contenido sobre las columnas.
-- =============================================================================

drop view if exists v_producto_contenido;

create view v_producto_contenido
with (security_invoker = true) as
with normalizado as (
    select
        p.id_producto,
        p.productos_cantidad_presentacion::numeric as cant_col,
        upper(trim(p.productos_unidad_medida_presentacion)) as uni_col,

        case upper(trim(p.productos_unidad_medida_presentacion))
            when 'G'   then 'g'   when 'GR'  then 'g'   when 'GRS' then 'g'
            when 'GRM' then 'g'   when 'GR.' then 'g'
            when 'KG'  then 'g'   when 'KGM' then 'g'   when 'KGR' then 'g'
            when 'ML'  then 'ml'  when 'ML.' then 'ml'  when 'MI'  then 'ml'
            when 'CC'  then 'ml'  when 'CC.' then 'ml'
            when 'CM3' then 'ml'  when 'CMQ' then 'ml'
            when 'L'   then 'ml'  when 'LT'  then 'ml'  when 'LT.' then 'ml'
            when 'LTR' then 'ml'  when 'DM3' then 'ml'  when 'DMQ' then 'ml'
            else null
        end as uni_canonica,

        case upper(trim(p.productos_unidad_medida_presentacion))
            when 'KG'  then 1000  when 'KGM' then 1000  when 'KGR' then 1000
            when 'L'   then 1000  when 'LT'  then 1000  when 'LT.' then 1000
            when 'LTR' then 1000  when 'DM3' then 1000  when 'DMQ' then 1000
            else 1
        end as factor
    from public.productos p
),
desde_columnas as (
    select
        n.id_producto,
        n.cant_col,
        n.uni_col,
        n.uni_canonica,
        case
            when n.uni_canonica is null or n.cant_col is null or n.cant_col <= 0
                then null

            -- En Electro, Bazar, Ferreteria, Automotor, Jugueteria y Bebes los
            -- numeros con unidad suelen ser CAPACIDAD, no contenido:
            --
            --   "EXPRIMIDOR MANDINE MCJ50 24L"  -> codigo de modelo
            --   "HELADERA NF LG 335L"           -> volumen interno
            --   "BANERA PLASTICA DE 24 LITROS"  -> capacidad del envase
            --
            -- Es el mismo criterio que aplica cargar_contenido.py al extraer
            -- de la descripcion.
            when v.categoria_slug in ('electro', 'bazar', 'ferreteria',
                                      'automotor', 'jugueteria', 'bebes',
                                      'jardin', 'pintureria', 'libreria',
                                      'indumentaria', 'textil-hogar')
                then null

            -- Decimal sin coma: "225 L" son 2,25 L, no 2250 L.
            -- Se detecta porque el resultado pasa de 20 litros / 20 kilos.
            when n.cant_col * n.factor > 20000 and n.factor = 1000
                 and n.cant_col between 100 and 9999
                then n.cant_col

            -- El caso inverso: el ETL guardo el valor en la unidad grande pero
            -- dejo la unidad chica. Un vino de 750 cc quedo como 0.75 con
            -- unidad "ml.", y se mostraba "0,75 ml".
            --
            -- Se reconocen porque son menores a 1 con unidad chica: no existe
            -- un producto de 0,75 mililitros.
            when n.factor = 1 and n.cant_col < 1
                then n.cant_col * 1000

            -- Sigue siendo absurdo: dato roto en origen, mejor no mostrar nada.
            when n.cant_col * n.factor > 20000
                then null

            else n.cant_col * n.factor
        end as base_col
    from normalizado n
    left join public.v_productos_categorizados v on v.id_producto = n.id_producto
)
select
    d.id_producto,
    coalesce(pc.cantidad, d.cant_col) as cantidad,
    coalesce(pc.unidad, d.uni_canonica, lower(d.uni_col)) as unidad,

    -- Primero lo extraido de la descripcion; si no hay, lo de las columnas.
    coalesce(pc.contenido_base, d.base_col) as contenido_base,

    coalesce(pc.origen, case when d.base_col is not null then 'columna' end) as origen,

    -- Texto listo para mostrar: "500 ml", "1,5 L", "2 kg".
    case
        when coalesce(pc.contenido_base, d.base_col) is null then null

        when coalesce(pc.contenido_base, d.base_col) >= 1000
             and coalesce(pc.unidad, d.uni_canonica) = 'g'
            then replace(trim_scale(coalesce(pc.contenido_base, d.base_col) / 1000)::text, '.', ',') || ' kg'

        when coalesce(pc.contenido_base, d.base_col) >= 1000
             and coalesce(pc.unidad, d.uni_canonica) = 'ml'
            then replace(trim_scale(coalesce(pc.contenido_base, d.base_col) / 1000)::text, '.', ',') || ' L'

        else replace(trim_scale(coalesce(pc.contenido_base, d.base_col))::text, '.', ',')
             || ' ' || coalesce(pc.unidad, d.uni_canonica)
    end as presentacion

from desde_columnas d
left join public.producto_contenido pc on pc.id_producto = d.id_producto;


comment on view v_producto_contenido is
  'Contenido del producto listo para mostrar. Usa primero lo extraido de la
   descripcion y, si no hay, las columnas del SEPA normalizadas, corrigiendo
   los decimales que el SEPA escribe sin coma.';


-- =============================================================================
-- CONTROLES
-- =============================================================================

-- A) Los casos que estaban mal. Manaos tiene que decir 2,25 L.
--
-- select p.productos_descripcion, v.presentacion, v.origen
-- from v_producto_contenido v
-- join productos p on p.id_producto = v.id_producto
-- where p.productos_descripcion ~* 'MANAOS|BENEDICTINO|PASTA FROLA|FULL SPORT'
-- limit 15;


-- B) Que no queden valores absurdos.
--
-- select p.productos_descripcion, v.presentacion
-- from v_producto_contenido v
-- join productos p on p.id_producto = v.id_producto
-- where v.contenido_base > 20000
-- order by v.contenido_base desc
-- limit 20;


-- C) Cobertura por origen.
--
-- select origen, count(*) from v_producto_contenido
-- where presentacion is not null group by 1;
