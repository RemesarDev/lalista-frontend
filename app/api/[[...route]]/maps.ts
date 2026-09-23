import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { supabase } from '@/app/_lib/supabase';
import { 
  autocompleteQuerySchema, 
  geocodeQuerySchema, 
  placeDetailsQuerySchema, 
  reverseGeocodeQuerySchema,
  sucursalesCercanasQuerySchema 
} from '@/app/_lib/apiSchemas';

// Helper para simular un User-Agent educado exigido por la política de Nominatim
const NOMINATIM_HEADERS = {
  'User-Agent': 'LALIsta-ProyectoEducativo/1.0 (contacto@proyecto.edu)',
  'Accept-Language': 'es'
};

export const mapsRouter = new Hono()
  // 1. AUTOCOMPLETE (Reemplazado por Nominatim search)
  .get('/autocomplete', 
    zValidator('query', autocompleteQuerySchema),
    async (c) => {
      const { input } = c.req.valid('query');
      
      try {
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(input)}&countrycodes=ar&addressdetails=1&limit=5`;
        const res = await fetch(url, { headers: NOMINATIM_HEADERS });

        if (!res.ok) return c.json({ error: 'Error consultando servicio de mapas' }, 500);
        const data = await res.json();

        // Transformamos la respuesta de Nominatim al formato que esperaba tu frontend
        const suggestions = data.map((item: any) => ({
          placePrediction: {
            placeId: String(item.place_id),
            text: { text: item.display_name },
            structuredFormat: {
              mainText: { text: item.name || item.address?.road || item.display_name.split(',')[0] },
              secondaryText: { text: item.display_name }
            }
          }
        }));

        return c.json({ suggestions });
      } catch (err) {
        console.error('Error en autocomplete Nominatim:', err);
        return c.json({ error: 'Error interno' }, 500);
      }
    }
  )

  // 2. GEOCODE (Reemplazado por Nominatim search)
  .get('/geocode', 
    zValidator('query', geocodeQuerySchema),
    async (c) => {
      const { address } = c.req.valid('query');

      try {
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&countrycodes=ar&limit=1`;
        const res = await fetch(url, { headers: NOMINATIM_HEADERS });
        const data = await res.json();
        
        if (!data?.[0]) return c.json({ error: 'No se encontraron resultados' }, 404);
        
        return c.json({ 
          lat: parseFloat(data[0].lat), 
          lng: parseFloat(data[0].lon) 
        });
      } catch (err) {
        console.error('Error en geocode Nominatim:', err);
        return c.json({ error: 'Error interno' }, 500);
      }
    }
  )

  // 3. DETAILS (Obtener coordenadas a partir del ID de Nominatim)
  .get('/details', 
    zValidator('query', placeDetailsQuerySchema),
    async (c) => {
      const { placeId } = c.req.valid('query');

      try {
        // Nominatim permite buscar directamente por lookup de place_id
        const url = `https://nominatim.openstreetmap.org/details.php?place_id=${placeId}&format=json`;
        // Como details.php a veces devuelve HTML o JSON estructurado distinto, una alternativa limpia es usar lookup por ID o guardar la lat/lng en cliente. 
        // Si prefieres una ruta segura con lookup:
        const lookupUrl = `https://nominatim.openstreetmap.org/search?format=json&osm_ids=R${placeId.replace(/\D/g,'')}&limit=1`;
        
        // Hacemos un approach directo consultando la API de búsqueda estándar si el ID es numérico simple
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&polygon_geojson=0&q=&place_id=${placeId}`, { headers: NOMINATIM_HEADERS });
        const data = await res.json();

        if (!data?.[0]) {
          return c.json({ error: 'No se encontraron coordenadas' }, 404);
        }

        return c.json({ 
          lat: parseFloat(data[0].lat), 
          lng: parseFloat(data[0].lon) 
        });
      } catch (err) {
        console.error('Error en details Nominatim:', err);
        return c.json({ error: 'No se encontraron coordenadas' }, 404);
      }
    }
  )

  // 4. REVERSE-GEOCODE (Reemplazado por Nominatim reverse)
  .get('/reverse-geocode', 
    zValidator('query', reverseGeocodeQuerySchema),
    async (c) => {
      const { lat, lng } = c.req.valid('query');

      try {
        const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`;
        const res = await fetch(url, { headers: NOMINATIM_HEADERS });
        const data = await res.json();

        if (data && data.display_name) {
          return c.json({ direccion: data.display_name });
        }
        return c.json({ direccion: "Ubicación detectada" });
      } catch (err) {
        console.error('Error en reverse-geocode Nominatim:', err);
        return c.json({ direccion: "Ubicación detectada" });
      }
    }
  )

  // 5. SUCURSALES CERCANAS (Intacta con Supabase - Sin cambios)
  .get('/sucursales-cercanas',
    zValidator('query', sucursalesCercanasQuerySchema),
    async (c) => {
      const { lat, lng, radio } = c.req.valid('query');

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
  );