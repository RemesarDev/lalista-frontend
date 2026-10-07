// app/_lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

// ==========================================
// DB1: Aplicación Principal y Autenticación
// ==========================================
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SERVICE_ROLE_KEY_SUPABASE;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error('Faltan las variables de entorno de Supabase (DB1) en .env.local');
}

// Service Role: la llave nunca sale del servidor porque no lleva el prefijo NEXT_PUBLIC_.
// Todos los endpoints que usan este cliente pasan por Hono, que valida la sesion antes de
// llamar y provee el user_id. Ese es el unico camino posible hacia estas funciones.
export const supabase = createClient(
  supabaseUrl,
  supabaseServiceRoleKey,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    }
  }
);


// ==========================================
// DB2: Base de Datos de Analíticas y Métricas
// ==========================================
const supabaseAnalyticsUrl = process.env.NEXT_PUBLIC_SUPABASE_ANALYTICS_URL;
const supabaseAnalyticsServiceRoleKey = process.env.SUPABASE_ANALYTICS_SERVICE_ROLE_KEY;

if (!supabaseAnalyticsUrl || !supabaseAnalyticsServiceRoleKey) {
  throw new Error('Faltan las variables de entorno de Supabase Analytics (DB2) en .env.local');
}

// Cliente con Service Role exclusivo para consultar las métricas de la DB2 de forma segura desde el backend
export const supabaseAnalytics = createClient(
  supabaseAnalyticsUrl, 
  supabaseAnalyticsServiceRoleKey,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    }
  }
);