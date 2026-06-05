import { Hono } from 'hono';
import { handle } from 'hono/vercel';
import { supabase } from '@/app/_lib/supabase';

const app = new Hono().basePath('/api');


const routes = app

//Enpoints I: de /buscar productos
// a. con ubicacion y sus precios por sucursal
.get('/productos', async (c) => {
  const search = c.req.query('search');
  const lat = c.req.query('lat');
  const lng = c.req.query('lng');
  const radio = c.req.query('radio');

  // Si no hay coordenadas no podemos filtrar por área
  if (!lat || !lng || !radio) {
    return c.json({ error: 'Faltan parámetros de ubicación' }, 400);
  }

  const { data, error } = await supabase.rpc('buscar_productos_por_area', {
    lat: parseFloat(lat),
    lng: parseFloat(lng),
    radio_km: parseFloat(radio),
    search_term: search ?? null,
  });

  if (error) {
    console.error("Error en RPC:", error);
    return c.json({ error: error.message }, 500);
  }

  // Agrupar por producto
  const mapaProductos = new Map<string, {
    id: string;
    nombre: string;
    sucursales: {
      cadena: string;
      direccion: string;
      precio: number;
      id_comercio: number;
      id_bandera: number;
    }[];
  }>();

  for (const fila of data) {
    if (!mapaProductos.has(fila.id_producto)) {
      mapaProductos.set(fila.id_producto, {
        id: fila.id_producto,
        nombre: fila.productos_descripcion,
        sucursales: [],
      });
    }

    const producto = mapaProductos.get(fila.id_producto)!;
    
    // Deduplicar por comercio+dirección
    const dir = `${fila.sucursales_calle ?? ''} ${fila.sucursales_numero ?? ''}`.trim() || 'Ubicación';
    const huella = `${fila.id_comercio}-${dir}`;

    if (!producto.sucursales.some(s => `${s.id_comercio}-${s.direccion}` === huella)) {
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
})

// b. Endpoint: busqueda sin ubicacion
.get('/catalogo', async (c) => {
  const search = c.req.query('search');

  if (!search || search.trim().length < 3) {
    return c.json({ productos: [] });
  }

  const { data, error } = await supabase.rpc('buscar_catalogo', {
    search_term: search,
  });

  if (error) {
    console.error("Error en catálogo:", error);
    return c.json({ error: error.message }, 500);
  }

  const productos = (data as { id_producto: string; productos_descripcion: string }[] ?? []).map(p => ({
    id: p.id_producto,
    nombre: p.productos_descripcion,
    precioMinimo: null,
    sucursales: [],
  }));

  return c.json({ productos });
})


//Endpoint II: de Ubicacion
// Endpoint: Autocomplete
.get('/maps/autocomplete', async (c) => {
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
})

// Endpoint: Geocoding
.get('/maps/geocode', async (c) => {
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
})

// Endpoint: Details (para obtener coordenadas precisas)
.get('/maps/details', async (c) => {
  const placeId = c.req.query('placeId');
  if (!placeId) return c.json({ error: 'Falta el placeId' }, 400);

  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  const url = `https://places.googleapis.com/v1/places/${placeId}?fields=location&key=${apiKey}`;

  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey!,
    },
  });

  const data = await res.json();
  
  if (!data.location) {
    return c.json({ error: 'No se encontraron coordenadas' }, 404);
  }

  return c.json({ 
    lat: data.location.latitude, 
    lng: data.location.longitude 
  });
})
// Endpoint: Reverse Geocoding
.get('/maps/reverse-geocode', async (c) => {
  const lat = c.req.query('lat');
  const lng = c.req.query('lng');
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;

  const res = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}&language=es`);
  const data = await res.json();

  if (data.status === 'OK' && data.results[0]) {
    return c.json({ direccion: data.results[0].formatted_address });
  }
  return c.json({ direccion: "Ubicación detectada" });
});

export const GET = handle(app);
export const POST = handle(app);
export type AppType = typeof routes;