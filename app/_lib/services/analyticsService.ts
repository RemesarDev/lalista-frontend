import { trackEvent } from "../utils/clientAnalytics";


export const analytics = {
  productSearched: (searchTerm: string, hasResults: boolean, userId?: string | null) =>
    trackEvent({
      eventName: 'product_searched',
      userId,
      metadata: { searchTerm, hasResults }
    }),

  listaSharing: (listaId: string, rol: 'viewer' | 'editor', userId?: string | null) =>
    trackEvent({
      eventName: 'lista_sharing',
      userId,
      metadata: { listaId, rolAsignado: rol }
    }),

  pricesCompared: (eans: string[], sucursalesCount: number, userId?: string | null) =>
    trackEvent({
      eventName: 'prices_compared',
      userId,
      metadata: { eans, custom_sucursales_count: sucursalesCount }
    }),
};