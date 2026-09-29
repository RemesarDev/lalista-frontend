import { AnalyticsEventName } from '@/app/_types/analytics';

interface TrackClientEventParams {
  eventName: AnalyticsEventName;
  userId?: string | null;
  metadata?: Record<string, any>;
}

export async function trackEvent({
  eventName,
  userId = null,
  metadata = {}
}: TrackClientEventParams) {
  // Si estamos en el cliente, disparamos la petición de forma asíncrona y silenciosa
  if (typeof window === 'undefined') return;

  try {
    await fetch('/api/analytics', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        eventName,
        userId,
        metadata,
      }),
    });
  } catch (error) {
    // Silenciamos errores de red en analítica para que nunca afecten la experiencia del usuario
    console.error('Error al enviar analítica:', error);
  }
}