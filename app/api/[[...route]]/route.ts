import { Hono } from 'hono';
import { handle } from 'hono/vercel';
import { supabase } from '@/app/_lib/supabase';

type SupabaseProductResponse = {
  id_producto: string;
  productos_descripcion: string;
  sucursal_productos: {
    productos_precio_lista: number;
    sucursales: {
      id_comercio: number | null;
      sucursales_calle: string | null;
      sucursales_numero: string | null;
      // Añadimos la relación de comercios aquí
      comercios: { comercio_bandera_nombre: string } | null;
    } | null;
  }[];
};

const app = new Hono().basePath('/api');

//ENDPOINTS
const routes = app.get('/productos', async (c) => {
  const search = c.req.query('search');
let query = supabase.from('productos').select(
    ` id_producto,
      productos_descripcion,
      sucursal_productos!inner (
        productos_precio_lista,
        sucursales!inner (
          id_comercio,
          sucursales_calle,
          sucursales_numero,
          comercios!fk_sucursales_comercios_compuesto (
            comercio_bandera_nombre
          )
        )
      )
    `);

  if (search) {
    query = query.ilike('productos_descripcion', `%${search}%`);
  }

  const { data, error } = await query
    .order('productos_precio_lista', { referencedTable: 'sucursal_productos', ascending: true })
    .limit(20);

  if (error) {
    console.error("Error en query Supabase:", error);
    return c.json({ error: error.message }, 500);
  }

  const typedData = (data as unknown) as SupabaseProductResponse[];

  const productosProcesados = typedData.map((p) => {
    // 1. Filtramos duplicados reales antes de cortar a 3
    const sucursalesUnicas = [];
    const vistas = new Set();

    for (const item of (p.sucursal_productos || [])) {
      const suc = item.sucursales;
      // Creamos una "huella" única de la sucursal
      const huella = `${suc?.id_comercio}-${suc?.sucursales_calle}-${suc?.sucursales_numero}`;
      
      if (!vistas.has(huella)) {
        sucursalesUnicas.push(item);
        vistas.add(huella);
      }
      
      if (sucursalesUnicas.length === 3) break;
    }

    return {
      id: p.id_producto,
      nombre: p.productos_descripcion,
        precios: sucursalesUnicas.map((item) => {
          const suc = item.sucursales;
          const calle = suc?.sucursales_calle ?? "";
          const numero = suc?.sucursales_numero ?? "";
          const dir = (calle || numero) ? `${calle} ${numero}`.trim() : "Ubicación";
      return {
        // Accedemos al nuevo campo que viene de la base de datos
        cadena: suc?.comercios?.comercio_bandera_nombre ?? "Genérico",
        direccion: dir,
        precio: item.productos_precio_lista ?? 0
      };
    })
    };
  });

  return c.json({ productos: productosProcesados });
});

export const GET = handle(app);
export const POST = handle(app);

export type AppType = typeof routes;