export type AnalyticsEventName = 
  | 'page_view'
  | 'user_signup'
  | 'user_login'
  | 'user_deleted'
  | 'product_searched'
  | 'prices_compared'
  | 'lista_sharing';

export interface AnalyticsEventPayload {
  eventName: AnalyticsEventName;
  userId?: string | null;
  metadata?: {
    hasResults?: boolean;
    eans?: string[];
    searchTerm?: string;
    pagePath?: string;
    [key: `custom_${string}`]: any; // Permite metadatos extensibles seguros
    [key: string]: any;
  };
}