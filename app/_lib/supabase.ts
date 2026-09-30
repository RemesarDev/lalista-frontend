// app/_lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

// ==========================================
// DB1: Aplicación Principal y Autenticación
// ==========================================
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Faltan las variables de entorno de Supabase (DB1) en .env.local');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);


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