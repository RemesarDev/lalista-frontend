import { trackEvent } from "../utils/clientAnalytics";

export const analytics = {
  // Visitas a la página
  pageView: (path: string, userId?: string | null) =>
    trackEvent({
      eventName: 'page_view',
      userId: userId || null,
      metadata: { path },
    }),

  // Productos buscados y precios comparados
  productSearched: (searchTerm: string, hasResults: boolean, userId?: string | null) =>
    trackEvent({
      eventName: 'product_searched',
      userId,
      metadata: { searchTerm, hasResults }
    }),

  pricesCompared: (
      eans: string[], 
      sucursalesCount: number, 
      lat?: number | null, 
      lng?: number | null, 
      userId?: string | null
    ) =>
      trackEvent({
        eventName: 'prices_compared',
        userId: userId || null,
        metadata: {
          eans,
          custom_sucursales_count: sucursalesCount,
          lat: lat ?? null,
          lng: lng ?? null,
        },
      }),
  
  // Ciclo de vida del usuario y sus listas
  listaSharing: (listaId: string, rol: 'viewer' | 'editor', userId?: string | null) =>
    trackEvent({
      eventName: 'lista_sharing',
      userId,
      metadata: { listaId, rolAsignado: rol }
    }),

  userSignup: (userId: string) =>
    trackEvent({
      eventName: 'user_signup',
      userId,
    }),

  userLogin: (userId: string) =>
    trackEvent({
      eventName: 'user_login',
      userId,
    }),

  userDeleted: (userId: string) =>
    trackEvent({
      eventName: 'user_deleted',
      userId,
    }),

  // Errores y problemas
  errorOccurred: (errorType: string, errorMessage: string, context?: string, userId?: string | null) =>
    trackEvent({
      eventName: 'app_error',
      userId: userId || null,
      metadata: { 
        errorType,       // Ej: 'AUTH_ERROR', 'API_SEARCH_FAIL', 'DB_ERROR'
        errorMessage,    // El mensaje legible o técnico del error
        context          // Dónde ocurrió (ej: 'login-page', 'search-bar')
      },
    }),
};