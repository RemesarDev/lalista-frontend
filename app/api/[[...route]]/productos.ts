import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { supabase } from '@/app/_lib/supabase';
import { productosQuerySchema, catalogoQuerySchema, preciosPorIdsQuerySchema } from '@/app/_lib/apiSchemas';
import { mapToProductoResponse, DbProductoRow } from '@/app/_lib/mappers/productos'; 
import { Producto } from '@/app/_types/productos';

// Auxiliar para agrupar filas de Supabase en Productos con sus sucursales ordenadas por menor precio
function agruparProductosConSucursales(rows: DbProductoRow[]): Producto[] {
  const mapaProductos = new Map<string, Producto>();

  for (const fila of rows) {
    if (!mapaProductos.has(fila.id_producto)) {
      mapaProductos.set(fila.id_producto, {
        ...mapToProductoResponse(fila),
        sucursales: []
      });
    }

    const producto = mapaProductos.get(fila.id_producto)!;
    const dir = `${fila.sucursales_calle ?? ''} ${fila.sucursales_numero ?? ''}`.trim() || 'Ubicación';
    const huella = `${fila.id_comercio}-${dir}`;

    if (!producto.sucursales.some((s) => `${s.id_comercio}-${s.direccion}` === huella)) {
      producto.sucursales.push({
        cadena: fila.comercio_bandera_nombre ?? 'Genérico',
        direccion: dir,
        precio: fila.productos_precio_lista ?? 0,
        id_comercio: fila.id_comercio,
        id_bandera: fila.id_bandera,
      });
    }
  }

  return Array.from(mapaProductos.values()).map(p => {
    // Garantizamos que las sucursales queden ordenadas de menor a mayor precio
    const sucursalesOrdenadas = [...p.sucursales].sort((a, b) => a.precio - b.precio);
    return {
      ...p,
      sucursales: sucursalesOrdenadas,
      precioMinimo: sucursalesOrdenadas[0]?.precio ?? 0,
    };
  });
}

export const productosRouter = new Hono()

  // /productos (Búsqueda por sucursales pre-filtradas)
  // En tu router de productos de Hono

// /productos (Búsqueda por sucursales pre-filtradas)
  .get('/productos', zValidator('query', productosQuerySchema), async (c) => {
    const { search, sucursales_ids, page, limit } = c.req.valid('query');
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 20;
    const offset = (pageNum - 1) * limitNum;

    const { data, error } = await supabase.rpc('buscar_productos_por_sucursales', {
      p_sucursales_ids: sucursales_ids,
      search_term: search ?? null,
      p_limit: limitNum,
      p_offset: offset,
    });

    if (error) {
      console.error('Error RPC productos:', error);
      return c.json({ error: error.message }, 500);
    }

    const rows = (data as any[]) ?? [];

    const productos: Producto[] = rows.map((r) => {
      const sucursales = Array.isArray(r.sucursales_json) ? r.sucursales_json : [];
      const precioMinimo = sucursales[0]?.precio ?? 0;

      // Usamos mapToProductoResponse si tu mapper construye 'id' y 'nombre', 
      // o mapeamos explícitamente las propiedades que exige tu tipo Producto:
      const baseProducto = mapToProductoResponse(r);

      return {
        ...baseProducto,
        id: r.id_producto,                           // Garantiza la propiedad 'id'
        nombre: r.productos_descripcion,             // Garantiza la propiedad 'nombre'
        id_producto: r.id_producto,
        productos_descripcion: r.productos_descripcion,
        url_imagen: r.url_imagen,
        precioMinimo,
        sucursales,
      };
    });

    return c.json({ 
      productos,
      hasMore: rows.length === limitNum 
    });
  })

  // /catalogo (Búsqueda general sin ubicación)
  .get('/catalogo', zValidator('query', catalogoQuerySchema), async (c) => {
    const { search, page, limit } = c.req.valid('query');
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 20;
    const offset = (pageNum - 1) * limitNum;

    const { data, error } = await supabase.rpc('buscar_catalogo', {
      search_term: search ?? null,
      p_limit: limitNum,
      p_offset: offset,
    });

    if (error) return c.json({ error: error.message }, 500);

    const rows = (data as DbProductoRow[]) ?? [];
    const productos = rows.map(p => mapToProductoResponse(p));

    return c.json({ 
      productos,
      hasMore: rows.length === limitNum
    });
  })

  // /precios-por-ids-area (Comparador de lista por sucursales)
  .get('/precios-por-ids-area', zValidator('query', preciosPorIdsQuerySchema), async (c) => {
    const { ids, sucursales_ids } = c.req.valid('query');

    const { data, error } = await supabase.rpc('buscar_precios_por_ids_sucursales', {
      ids_productos: ids,
      p_sucursales_ids: sucursales_ids,
    });

    if (error) return c.json({ error: error.message }, 500);

    const rows = (data as DbProductoRow[]) ?? [];
    const productos = agruparProductosConSucursales(rows);

    return c.json({ productos });
  });