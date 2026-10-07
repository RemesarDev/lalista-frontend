import { z } from 'zod';
import { USER_LIMITS } from './constants/limites';


// ==========================================
// 1. ESQUEMAS DE MAPS (Ubicación)
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
const categoriaParam = z
  .string()
  .regex(/^[a-z0-9-]+$/, { message: 'Slug de categoria invalido' })
  .optional();

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
  search: z.string().max(100, { message: 'La búsqueda es demasiado larga' }).optional(),
  sucursales_ids: z.string().transform((val) => val.split(',').filter(Boolean)),
  page: z.coerce
    .number()
    .int('La página debe ser un número entero')
    .min(1, 'La página mínima es 1')
    .default(1),
  limit: z.coerce
    .number()
    .int('El límite debe ser un número entero')
    .min(1, 'El límite mínimo es 1')
    .max(50, 'El límite máximo por consulta es 50') 
    .default(20),
  categoria: categoriaParam,
  etiquetas: etiquetasParam,
});

export const catalogoQuerySchema = z.object({
  search: z.string().max(100, { message: 'La búsqueda es demasiado larga' }).optional(),
  page: z.coerce
    .number()
    .int('La página debe ser un número entero')
    .min(1, 'La página mínima es 1')
    .default(1),
  limit: z.coerce
    .number()
    .int('El límite debe ser un número entero')
    .min(1, 'El límite mínimo es 1')
    .max(50, 'El límite máximo por consulta es 50') 
    .default(20),
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
  cantidad_opcion: z.number().int().positive().optional().default(1),
});

export const guardarListaSchema = z.object({
  nombre: z.string().min(1, 'El nombre es obligatorio').max(100),
  items: z.array(
    z.object({
      item_id: z.string().uuid('El item_id debe ser un UUID válido'),
      cantidad: z.number().int().min(1, 'La cantidad debe ser al menos 1'),
      comprado: z.boolean(),
      nombre_personalizado: z.string().nullable().optional(),
      opciones: z.array(opcionProductoSchema)
        .min(1, 'Cada grupo debe tener al menos una opción')
        .max(USER_LIMITS.MAX_ALTERNATIVAS_POR_ITEM, `Máximo ${USER_LIMITS.MAX_ALTERNATIVAS_POR_ITEM} alternativas permitidas`),
    })
  )
    .min(1, 'La lista debe tener al menos un producto')
    .max(USER_LIMITS.MAX_ITEMS_POR_LISTA, `La lista no puede superar los ${USER_LIMITS.MAX_ITEMS_POR_LISTA} productos`),
});

export const sincronizarListaSchema = z.object({
  nombre: z.string().trim().min(1).max(60).optional(),
  items: z.array(
    z.object({
      item_id: z.string(),
      cantidad: z.number().int().min(1),
      comprado: z.boolean(),
      nombre_personalizado: z.string().nullable().optional(),
      opciones: z.array(opcionProductoSchema)
        .min(1)
        .max(USER_LIMITS.MAX_ALTERNATIVAS_POR_ITEM, `Máximo ${USER_LIMITS.MAX_ALTERNATIVAS_POR_ITEM} alternativas permitidas`),
    })
  )
    .min(1)
    .max(USER_LIMITS.MAX_ITEMS_POR_LISTA, `La lista no puede superar los ${USER_LIMITS.MAX_ITEMS_POR_LISTA} productos`),
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
export const actualizarRolMiembroSchema = z.object({
  rol: z.enum(['viewer', 'editor']),
});

// ==========================================
// 5. ESQUEMAS DE DIRECCIONES
// ==========================================
export const agregarDireccionSchema = z.object({
  nombre_lugar:    z.string().min(1, 'El nombre del lugar es obligatorio'),
  latitud:         z.number({ message: 'Latitud inválida' }),
  longitud:        z.number({ message: 'Longitud inválida' }),
  radio_busqueda: z.number().min(1).max(10).optional().default(3),
});
export const actualizarRadioDireccionSchema = z.object({
  radio_busqueda: z.number().min(1).max(10),
});

// ==========================================
// 6. ESQUEMAS DE Analytics
// ==========================================
export const analyticsEventSchema = z.object({
  eventName: z.enum([
    'page_view',
    'user_signup',
    'user_login',
    'user_deleted',
    'product_searched',
    'prices_compared',
    'lista_sharing',
    'api_error',          
    'rate_limit_exceeded'
  ]),
  userId: z.string().nullable().optional(),
  metadata: z.record(z.string(), z.any()).optional().default({})
});

// ==========================================
// 7. ESQUEMAS DE ADMINISTRACIÓN (Admin Panel)
// ==========================================
export const adminMetricsQuerySchema = z.object({
    metricName: z.string().min(1, 'El nombre de la métrica es obligatorio'),
    search: z.string().max(100).optional(),
    field: z.string().optional(),
    startDate: z.string().optional(), 
    endDate: z.string().optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
});

// ==========================================
// 8. ESQUEMAS DE MENSAJES DE SOPORTE (Admin Panel)
// ==========================================
export const supportMessageSchema = z.object({
  subjectCategory: z.enum(['precios', 'cuenta', 'sugerencia', 'error', 'otro'], {
    message: 'Categoría de soporte inválida' 
  }),
  message: z
    .string()
    .min(5, { message: 'El mensaje debe tener al menos 5 caracteres' })
    .max(1000, { message: 'El mensaje no puede superar los 1000 caracteres' }),
});

// ==========================================
// 9. INFERENCIA DE TIPOS PARA EL FRONTEND
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
export type ActualizarRolMiembroBody = z.infer<typeof actualizarRolMiembroSchema>;
export type AgregarDireccionBody = z.infer<typeof agregarDireccionSchema>;
export type AnalyticsEventInput = z.infer<typeof analyticsEventSchema>; 
export type AdminMetricsQuery = z.infer<typeof adminMetricsQuerySchema>;
export type SupportMessageBody = z.infer<typeof supportMessageSchema>;