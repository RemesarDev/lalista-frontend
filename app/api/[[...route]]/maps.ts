import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';

export const mapsRouter = new Hono()
  .get('/autocomplete', 
    zValidator('query', z.object({ input: z.string().min(3) })),
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
      } catch (err) {
        return c.json({ error: 'Error interno' }, 500);
      }
    }
  )
  .get('/geocode', 
    zValidator('query', z.object({ address: z.string().min(1) })),
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
    zValidator('query', z.object({ placeId: z.string().min(1) })),
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
    zValidator('query', z.object({ 
      lat: z.coerce.number(), 
      lng: z.coerce.number() 
    })),
    async (c) => {
      const { lat, lng } = c.req.valid('query');
      const apiKey = process.env.GOOGLE_MAPS_API_KEY;

      const res = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}&language=es`);
      const data = await res.json();

      if (data.status === 'OK' && data.results[0]) return c.json({ direccion: data.results[0].formatted_address });
      return c.json({ direccion: "Ubicación detectada" });
    }
  );