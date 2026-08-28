import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { supabase } from '@/app/_lib/supabase';
import { productosQuerySchema, catalogoQuerySchema, preciosPorIdsQuerySchema } from '@/app/_lib/apiSchemas';
import { mapToProductoResponse, DbProductoRow } from '@/app/_lib/mappers/productos'; 
import { Producto, CategoriaArbol, EtiquetaDisponible } from '@/app/_types/productos';

function agruparProductosConSucursales(rows: any[]): Producto[] {
  const mapaProductos = new Map<string, Producto>();

  for (const fila of rows) {
    const idProd = fila.id_producto || fila.id;

    if (!mapaProductos.has(idProd)) {
      mapaProductos.set(idProd, {
        id: idProd,
        nombre: fila.productos_descripcion || fila.nombre || '',
        url_imagen: fila.url_imagen ?? null,
        precioMinimo: null,
        sucursales: [],
      });
    }

    const producto = mapaProductos.get(idProd)!;

    // Caso 1: La RPC devuelve un array de sucursales en formato JSON
    if (Array.isArray(fila.sucursales_json)) {
      // Nos aseguramos de mantener las distancias si ya venían en el JSON
      producto.sucursales = fila.sucursales_json.map((s: any) => ({
        ...s,
        distancia: s.distancia ?? s.distancia_km ?? null
      }));
    } else if (Array.isArray(fila.sucursales)) {
      producto.sucursales = fila.sucursales.map((s: any) => ({
        ...s,
        distancia: s.distancia ?? s.distancia_km ?? null
      }));
    } else {
      // Caso 2: La RPC devuelve filas aplanadas (JOIN tradicional)
      const dir = `${fila.sucursales_calle ?? ''} ${fila.sucursales_numero ?? ''}`.trim() || fila.direccion || 'Ubicación';
      const huella = `${fila.id_comercio}-${fila.id_bandera}-${dir}`;

      if (!producto.sucursales.some((s) => `${s.id_comercio}-${s.id_bandera}-${s.direccion}` === huella)) {
        producto.sucursales.push({
          cadena: fila.comercio_bandera_nombre ?? fila.cadena ?? 'Genérico',
          direccion: dir,
          precio: fila.productos_precio_lista ?? fila.precio ?? 0,
          id_comercio: fila.id_comercio,
          id_bandera: fila.id_bandera,
          latitud: fila.latitud,
          longitud: fila.longitud,
          // Agregamos la distancia. Soporta nombres de columna "distancia_km" o "distancia"
          distancia: fila.distancia_km ?? fila.distancia ?? null, 
        });
      }
    }
  }

  // Ordenar sucursales por menor precio y calcular precioMinimo
  return Array.from(mapaProductos.values()).map((p) => {
    const sucursalesOrdenadas = [...p.sucursales].sort((a, b) => a.precio - b.precio);
    return {
      ...p,
      sucursales: sucursalesOrdenadas,
      precioMinimo: sucursalesOrdenadas[0]?.precio ?? null,
    };
  });
}

export const productosRouter = new Hono()

  .get('/productos', zValidator('query', productosQuerySchema), async (c) => {
    const { search, sucursales_ids, page, limit, categoria, etiquetas } = c.req.valid('query');
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 20;
    const offset = (pageNum - 1) * limitNum;

    // sucursales_ids ya viene como string[] gracias a Zod
    const { data, error } = await supabase.rpc('buscar_productos_por_sucursales', {
      p_sucursales_ids: sucursales_ids,
      search_term: search ?? null,
      p_limit: limitNum,
      p_offset: offset,
      p_categoria_slug: categoria ?? null,
      p_etiquetas: etiquetas.length > 0 ? etiquetas : null,
    });

    if (error) {
      console.error('Error RPC productos:', error);
      return c.json({ error: error.message }, 500);
    }

    const rows = (data as any[]) ?? [];
    const productos = agruparProductosConSucursales(rows);

    return c.json({ 
      productos,
      hasMore: rows.length === limitNum 
    });
  })

  .get('/catalogo', zValidator('query', catalogoQuerySchema), async (c) => {
    const { search, page, limit, categoria, etiquetas } = c.req.valid('query');
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 20;
    const offset = (pageNum - 1) * limitNum;

    const { data, error } = await supabase.rpc('buscar_catalogo', {
      search_term: search ?? null,
      p_limit: limitNum,
      p_offset: offset,
      p_categoria_slug: categoria ?? null,
      p_etiquetas: etiquetas.length > 0 ? etiquetas : null,
    });

    if (error) {
      console.error('Error RPC catalogo:', error);
      return c.json({ error: error.message }, 500);
    }

    const rows = (data as DbProductoRow[]) ?? [];
    const productos = rows.map((p) => mapToProductoResponse(p));

    return c.json({ 
      productos,
      hasMore: rows.length === limitNum
    });
  })

  .get('/precios-por-ids-area', zValidator('query', preciosPorIdsQuerySchema), async (c) => {
    const { ids, sucursales_ids,lat, lng } = c.req.valid('query');

    const arrayIds = ids.split(',').map((id) => id.trim()).filter(Boolean);
    const arraySucursales = sucursales_ids.split(',').map((id) => id.trim()).filter(Boolean);

    const parsedLat = lat ? parseFloat(lat) : null;
    const parsedLng = lng ? parseFloat(lng) : null;

    const { data, error } = await supabase.rpc('buscar_precios_por_ids_sucursales', {
      ids_productos: arrayIds,
      p_sucursales_ids: arraySucursales,
      p_lat: parsedLat,
      p_lng: parsedLng,
    });

    if (error) {
      console.error('Error RPC precios-por-ids-area:', error);
      return c.json({ error: error.message }, 500);
    }

    const rows = (data as any[]) ?? [];
    const productos = agruparProductosConSucursales(rows);

    return c.json({ productos });
  })

// CATEGORIAS Y ETIQUETAS
// Devuelve los rubros con sus categorias anidadas y las etiquetas dietarias con
// su conteo. Van juntos en un solo endpoint porque el frontend los necesita a
// la vez: asi se evita una segunda peticion.
  .get('/categorias', async (c) => {
    const [resCategorias, resEtiquetas] = await Promise.all([
      supabase
        .from('categorias')
        .select('id, slug, nombre, orden, categoria_padre_id, es_canasta')
        .order('orden', { ascending: true }),
      supabase
        .from('v_etiquetas_disponibles')
        .select('codigo, nombre, productos'),
    ]);

    const { data, error } = resCategorias;
    if (error) {
      console.error('Error consultando categorias:', error);
      return c.json({ error: error.message }, 500);
    }

    const filas = (data ?? []) as Array<{
      id: number;
      slug: string;
      nombre: string;
      orden: number;
      categoria_padre_id: number | null;
      es_canasta: boolean;
    }>;

    // Los rubros son las filas sin padre. Cada uno se arma con sus hijas.
    const rubros: CategoriaArbol[] = filas
      .filter((f) => f.categoria_padre_id === null)
      .map((rubro) => ({
        slug: rubro.slug,
        nombre: rubro.nombre,
        orden: rubro.orden,
        es_canasta: rubro.es_canasta,
        categorias: filas
          .filter((f) => f.categoria_padre_id === rubro.id)
          .sort((a, b) => a.orden - b.orden)
          .map((hija) => ({
            slug: hija.slug,
            nombre: hija.nombre,
            orden: hija.orden,
            es_canasta: hija.es_canasta,
          })),
      }));

    // Si fallan las etiquetas no se corta todo: el menu de categorias sirve
    // igual y los filtros dietarios simplemente no se muestran.
    const etiquetas = (resEtiquetas.data ?? []) as EtiquetaDisponible[];

    return c.json({ rubros, etiquetas });
  });