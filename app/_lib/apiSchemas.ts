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
// Slug de categoria o rubro. Minusculas, numeros y guiones: nada mas.
const categoriaParam = z
  .string()
  .regex(/^[a-z0-9-]+$/, { message: 'Slug de categoria invalido' })
  .optional();

// Etiquetas dietarias: llegan como "SIN_TACC,DIET" y se convierten a array.
// Se validan contra mayusculas y guion bajo para que no entre texto arbitrario.
const etiquetasParam = z
  .string()
  .optional()
  .transform((val) =>
    val ? val.split(',').map((e) => e.trim().toUpperCase()).filter(Boolean) : []
  )
  .refine((arr) => arr.length <= 5, { message: 'Maximo 5 etiquetas' })
  .refine((arr) => arr.every((e) => /^[A-Z_]+$/.test(e)), {
    message: 'Etiqueta invalida',
  });

export const productosQuerySchema = z.object({
  search: z.string().optional(),
  sucursales_ids: z.string().transform((val) => val.split(',').filter(Boolean)),
  page: z.string().optional().default('1'),
  limit: z.string().optional().default('20'),
  categoria: categoriaParam,
  etiquetas: etiquetasParam,
});

export const catalogoQuerySchema = z.object({
  // Opcional: se puede navegar por categoria sin escribir nada en el buscador.
  search: z.string().optional(),
  page: z.string().optional().default('1'),
  limit: z.string().optional().default('20'),
  categoria: categoriaParam,
  etiquetas: etiquetasParam,
});

export const preciosPorIdsQuerySchema = z.object({
  ids: z.string().min(1, 'Se requiere al menos un ID de producto'),
  sucursales_ids: z.string().min(1, 'Se requiere al menos un ID de sucursal'),
  lat: z.string().optional(),
  lng: z.string().optional(),
});

// ==========================================
// 3. ESQUEMAS DE LISTAS (Supabase DB)
// ==========================================
export const opcionProductoSchema = z.object({
  id_producto: z.string(),
  descripcion: z.string(),
  imagen: z.string().nullable().optional(),
  es_principal: z.boolean().default(false),
});

export const guardarListaSchema = z.object({
  nombre: z.string().min(1, 'El nombre es obligatorio').max(100),
  items: z.array(
    z.object({
      item_id: z.uuid('El item_id debe ser un UUID válido'),
      cantidad: z.number().int().min(1, 'La cantidad debe ser al menos 1'),
      comprado: z.boolean(),
      opciones: z.array(opcionProductoSchema).min(1, 'Cada grupo debe tener al menos una opción'),
    })
  ).min(1, 'La lista debe tener al menos un producto'),
});
export const sincronizarListaSchema = z.object({
  items: z.array(
    z.object({
      item_id: z.string(),
      cantidad: z.number().int().min(1),
      comprado: z.boolean(),
      opciones: z.array(opcionProductoSchema).min(1),
    })
  ).min(1),
});

// ==========================================
// 4. ESQUEMAS DE USUARIOS
// ==========================================
export const buscarUsuariosSchema = z.object({
  email: z.string().min(5, 'Ingresá al menos 5 caracteres'),
});

export const compartirListaSchema = z.object({
  userId: z.string(),
  rol: z.enum(['viewer', 'editor']).default('viewer'),
});

// ==========================================
// 5. INFERENCIA DE TIPOS PARA EL FRONTEND
// ==========================================
export type AutocompleteQuery = z.infer<typeof autocompleteQuerySchema>;
export type GeocodeQuery = z.infer<typeof geocodeQuerySchema>;
export type PlaceDetailsQuery = z.infer<typeof placeDetailsQuerySchema>;
export type ReverseGeocodeQuery = z.infer<typeof reverseGeocodeQuerySchema>;
export type ProductosQuery = z.infer<typeof productosQuerySchema>;
export type CatalogoQuery = z.infer<typeof catalogoQuerySchema>;
export type GuardarListaBody = z.infer<typeof guardarListaSchema>;
export type SincronizarListaBody = z.infer<typeof sincronizarListaSchema>;
export type BuscarUsuariosQuery = z.infer<typeof buscarUsuariosSchema>;
export type CompartirListaBody = z.infer<typeof compartirListaSchema>;