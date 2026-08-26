import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { supabase } from '@/app/_lib/supabase'; // Asegurate de importar tu cliente de Supabase
import { 
  autocompleteQuerySchema, 
  geocodeQuerySchema, 
  placeDetailsQuerySchema, 
  reverseGeocodeQuerySchema,
  sucursalesCercanasQuerySchema 
} from '@/app/_lib/apiSchemas';

export const mapsRouter = new Hono()
  .get('/autocomplete', 
    zValidator('query', autocompleteQuerySchema),
    async (c) => {
      const { input } = c.req.valid('query');
      const apiKey = process.env.GOOGLE_MAPS_API_KEY;
      
      if (!apiKey) return c.json({ error: 'API key no configurada' }, 500);

      try {
        const res = await fetch('https://places.googleapis.com/v1/places:autocomplete', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': apiKey,
          },
          body: JSON.stringify({ input, includedRegionCodes: ['ar'], includedPrimaryTypes: ['geocode'] }),
        });

        if (!res.ok) return c.json({ error: 'Error consultando Google Places' }, 500);
        const data = await res.json();
        return c.json({ suggestions: data.suggestions ?? [] });
      } catch {
        return c.json({ error: 'Error interno' }, 500);
      }
    }
  )
  .get('/geocode', 
    zValidator('query', geocodeQuerySchema),
    async (c) => {
      const { address } = c.req.valid('query');
      const apiKey = process.env.GOOGLE_MAPS_API_KEY;
      if (!apiKey) return c.json({ error: 'API key no configurada' }, 500);

      const params = new URLSearchParams({ address, region: 'ar', key: apiKey });
      const res = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?${params}`);
      const data = await res.json();
      
      if (data.status !== 'OK' || !data.results?.[0]) return c.json({ error: 'No se encontraron resultados' }, 404);
      return c.json({ lat: data.results[0].geometry.location.lat, lng: data.results[0].geometry.location.lng });
    }
  )
  .get('/details', 
    zValidator('query', placeDetailsQuerySchema),
    async (c) => {
      const { placeId } = c.req.valid('query');
      const apiKey = process.env.GOOGLE_MAPS_API_KEY;
      const res = await fetch(`https://places.googleapis.com/v1/places/${placeId}?fields=location&key=${apiKey}`, {
        headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': apiKey! },
      });

      const data = await res.json();
      if (!data.location) return c.json({ error: 'No se encontraron coordenadas' }, 404);
      return c.json({ lat: data.location.latitude, lng: data.location.longitude });
    }
  )
  .get('/reverse-geocode', 
    zValidator('query', reverseGeocodeQuerySchema),
    async (c) => {
      const { lat, lng } = c.req.valid('query');
      const apiKey = process.env.GOOGLE_MAPS_API_KEY;

      const res = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}&language=es`);
      const data = await res.json();

      if (data.status === 'OK' && data.results[0]) return c.json({ direccion: data.results[0].formatted_address });
      return c.json({ direccion: "Ubicación detectada" });
    }
  )
  // NUEVO ENDPOINT DE SUCURSALES
  .get('/sucursales-cercanas',
  zValidator('query', sucursalesCercanasQuerySchema),
  async (c) => {
    const { lat, lng, radio } = c.req.valid('query');

    // Forzar conversión numérica para PostgreSQL (float8)
    const latNum = Number(lat);
    const lngNum = Number(lng);
    const radioNum = Number(radio);

    if (isNaN(latNum) || isNaN(lngNum) || isNaN(radioNum)) {
      return c.json({ error: 'Parámetros numéricos inválidos' }, 400);
    }

    try {
      const { data, error } = await supabase.rpc('obtener_sucursales_cercanas', {
        lat: latNum,
        lng: lngNum,
        radio_km: radioNum,
      });

      if (error) {
        console.error('Error Supabase RPC:', error);
        // Retornamos el objeto 'error' de Supabase para ver detalles exactos en el cliente
        return c.json({ 
          error: error.message, 
          details: error.details, 
          hint: error.hint, 
          code: error.code 
        }, 500);
      }

      return c.json({ sucursales: data ?? [] });
    } catch (err: any) {
      console.error('Excepción en sucursales-cercanas:', err);
      return c.json({ error: err?.message || 'Error interno del servidor' }, 500);
    }
  }
)