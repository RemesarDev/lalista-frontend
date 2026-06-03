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
      comercios: { comercio_bandera_nombre: string } | null;
    } | null;
  }[];
};

const app = new Hono().basePath('/api');

//ENDPOINTS
const routes = 
//ENDPOINT I: Busqueda
  app.get('/productos', async (c) => {
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

    //ALGO QUE SE DEBE RESOLVER! EL CODIGO BUSCA 50 Y MUESTRA EN JS 20. 
    //COMO DEBE FUNCIONAR? EL CODIGO DEBE MOSTRAR TODOS MAXIMOS PERMITIDOS EN UNA CONSULTA Y LOS RESULTADOS QUE BUSQUE PERO CARGARLOS EN JS DE MODO DINAMICO. 
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

//Endpoint II: de Ubicacion
// Endpoint: Autocomplete
app.get('/maps/autocomplete', async (c) => {
  const input = c.req.query('input');
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  
  //PARA DEPURACION
  //console.log("AUTOCOMPLETE - input:", input, "| key:", apiKey ? "OK" : "FALTA");

  if (!input || input.trim().length < 3) return c.json({ suggestions: [] });
  if (!apiKey) return c.json({ error: 'API key no configurada' }, 500);

  try {
    const res = await fetch('https://places.googleapis.com/v1/places:autocomplete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
      },
      body: JSON.stringify({
        input,
        includedRegionCodes: ['ar'],
        includedPrimaryTypes: ['geocode'],
      }),
    });

    //DEPURACION
    const responseText = await res.text();
    //console.log("Google response status:", res.status);
    //console.log("Google response body:", responseText);

    if (!res.ok) return c.json({ error: 'Error consultando Google Places' }, 500);

    const data = JSON.parse(responseText);
    return c.json({ suggestions: data.suggestions ?? [] });

  } catch (err) {
    console.error("Error en autocomplete:", err);
    return c.json({ error: 'Error interno' }, 500);
  }
});

// Endpoint: Geocoding
app.get('/maps/geocode', async (c) => {
  const address = c.req.query('address');
  if (!address) return c.json({ error: 'Falta el parámetro address' }, 400);

  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) return c.json({ error: 'API key no configurada' }, 500);

  const params = new URLSearchParams({
    address,
    region: 'ar',
    key: apiKey,
  });

  const res = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?${params}`);
  
  if (!res.ok) {
    return c.json({ error: 'Error consultando Google Geocoding' }, 500);
  }

  const data = await res.json();
  
  if (data.status !== 'OK' || !data.results?.[0]) {
    return c.json({ error: 'No se encontraron resultados' }, 404);
  }

  const loc = data.results[0].geometry.location;
  return c.json({ lat: loc.lat, lng: loc.lng });
});


export const GET = handle(app);
export const POST = handle(app);
export type AppType = typeof routes;