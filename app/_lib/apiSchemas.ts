import { z } from 'zod';

// ==========================================
// 1. ESQUEMAS DE GOOGLE MAPS (Ubicación)
// ==========================================

export const autocompleteQuerySchema = z.object({
  input: z.string().min(3, { message: 'El input debe tener al menos 3 caracteres' })
});

export const geocodeQuerySchema = z.object({
  address: z.string().min(1, { message: 'La dirección es obligatoria' })
});

export const placeDetailsQuerySchema = z.object({
  placeId: z.string().min(1, { message: 'El placeId es obligatorio' })
});

export const reverseGeocodeQuerySchema = z.object({
  lat: z.coerce.number({ message: 'Latitud inválida' }),
  lng: z.coerce.number({ message: 'Longitud inválida' })
});

export const sucursalesCercanasQuerySchema = z.object({
  lat: z.coerce.number({ message: 'La latitud es requerida y debe ser numérica' }),
  lng: z.coerce.number({ message: 'La longitud es requerida y debe ser numérica' }),
  radio: z.coerce.number().optional().default(5),
});

// ==========================================
// 2. ESQUEMAS DE PRODUCTOS (Supabase DB)
// ==========================================

export const productosQuerySchema = z.object({
  search: z.string().optional(),
  sucursales_ids: z.string().transform((val) => val.split(',').filter(Boolean)),
  page: z.string().optional().default('1'),
  limit: z.string().optional().default('20'),
});

export const catalogoQuerySchema = z.object({
  search: z.string(),
  page: z.string().optional().default('1'),
  limit: z.string().optional().default('20'),
});

export const preciosPorIdsQuerySchema = z.object({
  ids: z.string().transform((val) => val.split(',')),
  sucursales_ids: z.string().transform((val) => val.split(',').filter(Boolean)),
});
// ==========================================
// 3. INFERENCIA DE TIPOS PARA EL FRONTEND
// ==========================================
// Exportamos las interfaces generadas automáticamente por Zod.
// Los hooks de la carpeta `_hooks` podrán importar estos tipos 
// para asegurar que envían los datos correctos a la API.

export type AutocompleteQuery = z.infer<typeof autocompleteQuerySchema>;
export type GeocodeQuery = z.infer<typeof geocodeQuerySchema>;
export type PlaceDetailsQuery = z.infer<typeof placeDetailsQuerySchema>;
export type ReverseGeocodeQuery = z.infer<typeof reverseGeocodeQuerySchema>;
export type ProductosQuery = z.infer<typeof productosQuerySchema>;
export type CatalogoQuery = z.infer<typeof catalogoQuerySchema>;