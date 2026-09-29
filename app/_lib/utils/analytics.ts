import { createClient } from '@supabase/supabase-js';

// Cliente de Supabase usando la Service Role Key (solo vive en el servidor)
const supabaseAnalytics = createClient(
  process.env.SUPABASE_ANALYTICS_URL || process.env.NEXT_PUBLIC_SUPABASE_ANALYTICS_URL || '',
  process.env.SUPABASE_ANALYTICS_SERVICE_ROLE_KEY || ''
);

interface TrackEventParams {
  eventName: string;
  region?: string;
  userId?: string | null;
  metadata?: Record<string, any>;
}

export async function insertAnalyticsEvent({
  eventName,
  region = 'Desconocida',
  userId = null,
  metadata = {},
}: TrackEventParams) {
  try {
    const { error } = await supabaseAnalytics.from('analytics_events').insert({
      event_name: eventName,
      region,
      user_id: userId,
      metadata,
    });

    if (error) {
      console.error('Error al insertar evento analítico en Supabase:', error.message);
    }
  } catch (err) {
    console.error('Falla inesperada en el servicio de analytics:', err);
  }
}