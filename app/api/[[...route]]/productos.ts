import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { supabase } from '@/app/_lib/supabase';
// Importamos nuestros esquemas centralizados
import { productosQuerySchema, catalogoQuerySchema } from '@/app/_lib/apiSchemas';

// Definimos la interfaz del objeto Sucursal para evitar el error de inferencia "never[]"
interface SucursalResponse {
  cadena: string;
  direccion: string;
  precio: number;
  id_comercio: number;
  id_bandera: number;
}

// Definimos la estructura exacta que el frontend espera recibir
interface ProductoResponse {
  id: string;
  nombre: string;
  url_imagen: string | null;
  precioMinimo: number | null;
  sucursales: SucursalResponse[];
}

export const productosRouter = new Hono()
  // Endpoint a: Búsqueda con ubicación
  .get('/productos', 
    zValidator('query', productosQuerySchema), // Validamos usando el esquema importado
    async (c) => {
      const { search, lat, lng, radio } = c.req.valid('query');

      const { data, error } = await supabase.rpc('buscar_productos_por_area', {
        lat: lat,
        lng: lng,
        radio_km: radio,
        search_term: search ?? null,
      });

      if (error) {
        console.error("Error en RPC:", error);
        return c.json({ error: error.message }, 500);
      }

      const mapaProductos = new Map<string, Omit<ProductoResponse, 'precioMinimo'>>();

      for (const fila of data) {
        if (!mapaProductos.has(fila.id_producto)) {
          mapaProductos.set(fila.id_producto, {
            id: fila.id_producto,
            nombre: fila.productos_descripcion,
            url_imagen: fila.url_imagen ?? null,
            sucursales: [], // Aquí TypeScript ya sabe que es de tipo SucursalResponse[]
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

      // Tipamos el array de salida de manera explícita
      const productos: ProductoResponse[] = Array.from(mapaProductos.values()).map(p => ({
        ...p,
        precioMinimo: p.sucursales[0]?.precio ?? 0,
      }));

      return c.json({ productos });
    }
  )

  // Endpoint b: Búsqueda sin ubicación (Catálogo)
  .get('/catalogo', 
    zValidator('query', catalogoQuerySchema), // Validamos usando el esquema importado
    async (c) => {
      const { search } = c.req.valid('query');

      const { data, error } = await supabase.rpc('buscar_catalogo', {
        search_term: search,
      });

      if (error) {
        console.error("Error en catálogo:", error);
        return c.json({ error: error.message }, 500);
      }

      // Solución definitiva al contrato: Agregamos url_imagen y tipamos el array explícitamente para evitar "never[]"
      const productos: ProductoResponse[] = (data as any[] ?? []).map(p => ({
        id: p.id_producto,
        nombre: p.productos_descripcion,
        url_imagen: p.url_imagen ?? null, // Cumple el contrato
        precioMinimo: null,
        sucursales: [], // Tipado como SucursalResponse[] gracias al mapping explícito
      }));

      return c.json({ productos });
    }
  );
