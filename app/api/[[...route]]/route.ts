import { Hono } from 'hono';
import { handle } from 'hono/vercel';
import { supabase } from '@/app/_lib/supabase';

// Definición del tipo para asegurar la estructura de datos que esperamos de la DB
type SupabaseProductResponse = {
  id_producto: string;
  productos_descripcion: string;
  sucursal_productos: {
    productos_precio_lista: number;
    sucursales: {
      sucursales_nombre: string;
    } | null | any;
  }[];
};

// Inicializamos la app Hono
const app = new Hono().basePath('/api');

const routes = app.get('/productos', async (c) => {
  // 1. Obtenemos el parámetro 'search' de la URL
  const search = c.req.query('search');

  // 2. Construimos la query base
  let query = supabase.from('productos').select(`
      id_producto,
      productos_descripcion,
      sucursal_productos!inner (
        productos_precio_lista,
        sucursales!inner (id_unico, sucursales_nombre)
      )
  `);

  // 3. Filtramos si el usuario escribió algo
  if (search) {
    query = query.ilike('productos_descripcion', `%${search}%`);
  }

  // 4. Ejecutamos la consulta sin encadenar .returns (evitando errores de versión)
  const { data, error } = await query
    .order('productos_precio_lista', { referencedTable: 'sucursal_productos', ascending: true })
    .limit(20);

  if (error) return c.json({ error: error.message }, 500);

  // 5. Aplicamos el cast seguro para tratar 'data' con nuestro tipo definido
  const typedData = (data as unknown) as SupabaseProductResponse[];

  // 6. Procesamos los datos para el Frontend
  const productosProcesados = typedData.map((p) => {
    // 1. Tomamos el array de sucursales asociadas (que ya viene ordenado por precio)
    const sucursalesOrdenadas = p.sucursal_productos || [];

    // 2. Mapeamos solo las primeras 3 (o menos si no hay tantas)
    const top3Precios = sucursalesOrdenadas.slice(0, 3).map(item => ({
      nombre: item.sucursales?.sucursales_nombre ?? "Desconocido",
      precio: item.productos_precio_lista ?? 0
    }));

    return {
      id: p.id_producto,
      nombre: p.productos_descripcion,
      // Mantenemos la estructura para el frontend
      precios: top3Precios,
      // Opcional: seguimos manteniendo el primero para compatibilidad rápida
      precioMin: top3Precios[0]?.precio ?? 0,
      superMasBarato: top3Precios[0]?.nombre ?? "Sin datos",
    };
  });

  return c.json({ productos: productosProcesados });
});

export const GET = handle(app);
export const POST = handle(app);

export type AppType = typeof routes;