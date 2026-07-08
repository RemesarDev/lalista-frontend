import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { supabase } from '@/app/_lib/supabase';
import { productosQuerySchema, catalogoQuerySchema, preciosPorIdsQuerySchema } from '@/app/_lib/apiSchemas';
import { mapToProductoResponse, DbProductoRow } from '@/app/_lib/mappers/productos'; 
import { Producto } from '@/app/_types/productos';

  //CONSULTA CON UBICACION
export const productosRouter = new Hono()
  .get('/productos', 

    zValidator('query', productosQuerySchema),   
    async (c) => {
      const { search, lat, lng, radio } = c.req.valid('query');
    
      const { data, error } = await supabase.rpc('buscar_productos_por_area', {
        lat, lng, radio_km: radio, search_term: search ?? null,
      });

      if (error) return c.json({ error: error.message }, 500);

      // Usamos DbProductoRow[] en lugar de any
      const rows = (data as DbProductoRow[]) ?? [];
      const mapaProductos = new Map<string, Producto>();

      for (const fila of rows) {
        if (!mapaProductos.has(fila.id_producto)) {
          mapaProductos.set(fila.id_producto, {
            ...mapToProductoResponse(fila), // Pasamos toda la fila directamente
            sucursales: [] 
          });
        }

        const producto = mapaProductos.get(fila.id_producto)!;
        const dir = `${fila.sucursales_calle ?? ''} ${fila.sucursales_numero ?? ''}`.trim() || 'Ubicación';
        const huella = `${fila.id_comercio}-${dir}`;

        // Tipamos explícitamente el 'some' para eliminar el any
        if (!producto.sucursales.some((s: { id_comercio: number; direccion: string }) => `${s.id_comercio}-${s.direccion}` === huella)) {
          producto.sucursales.push({
            cadena: fila.comercio_bandera_nombre ?? 'Genérico',
            direccion: dir,
            precio: fila.productos_precio_lista ?? 0,
            id_comercio: fila.id_comercio,
            id_bandera: fila.id_bandera,
          });
        }
      }

      const productos = Array.from(mapaProductos.values()).map(p => ({
        ...p,
        precioMinimo: p.sucursales[0]?.precio ?? 0,
      }));

      return c.json({ productos });
    }
  )

  //CONSULTA SIN UBICACION
  .get('/catalogo', 
    zValidator('query', catalogoQuerySchema),
    async (c) => {
      const { search } = c.req.valid('query');

      const { data, error } = await supabase.rpc('buscar_catalogo', { search_term: search });

      if (error) return c.json({ error: error.message }, 500);

      // 🚀 Ahora el mapping es directo y seguro
      const rows = (data as DbProductoRow[]) ?? [];
      const productos = rows.map(p => mapToProductoResponse(p));

      return c.json({ productos });
    }
  )
//CONSULTA POR IDS CON UBICACION PARA COMPARAR PRECIOS
  .get('/precios-por-ids-area',
  zValidator('query', preciosPorIdsQuerySchema),
  async (c) => {
    const { ids, lat, lng, radio } = c.req.valid('query');
    const { data, error } = await supabase.rpc('buscar_precios_por_ids_area', {
      ids_productos: ids, lat, lng, radio_km: radio,
    });
    if (error) return c.json({ error: error.message }, 500);

    const rows = (data as DbProductoRow[]) ?? [];
    const mapaProductos = new Map<string, Producto>();
    for (const fila of rows) {
      if (!mapaProductos.has(fila.id_producto)) {
        mapaProductos.set(fila.id_producto, {
          ...mapToProductoResponse(fila),
          sucursales: [],
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
    const productos = Array.from(mapaProductos.values()).map(p => ({
      ...p,
      precioMinimo: p.sucursales[0]?.precio ?? 0,
    }));
    return c.json({ productos });
  }
);