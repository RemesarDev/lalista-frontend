// app/_components/global/AnalyticsTracker.tsx
'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { analytics } from '@/app/_lib/services/analyticsService';
import { useListaStore } from '@/app/_store/store';

export function AnalyticsTracker() {
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const user = useListaStore((state) => state.user);
    const loadingAuth = useListaStore((state) => (state as any).loadingAuth);

    const lastTrackedPath = useRef<string | null>(null);

    // 1. Rastreo de visitas a páginas (Page Views)
    useEffect(() => {
        if (loadingAuth) return;
        if (!pathname) return;

        const queryStr = searchParams?.toString();
        const fullPath = queryStr ? `${pathname}?${queryStr}` : pathname;

        if (lastTrackedPath.current === fullPath) return;
        lastTrackedPath.current = fullPath;

        analytics.pageView(fullPath, user?.id).catch(console.error);
    }, [pathname, searchParams, user?.id, loadingAuth]);

    // 2. Automatización global de errores (Fetch & Promesas)
    useEffect(() => {
        if (typeof window === 'undefined') return;

        // --- INTERCEPTOR GLOBAL DE FETCH ---
        const originalFetch = window.fetch;
        window.fetch = async (...args) => {
            const url = args[0]?.toString() || '';
            
            // Evitamos bucles infinitos no reportando las llamadas al propio endpoint de analíticas
            if (url.includes('/api/analytics')) {
                return originalFetch(...args);
            }

            try {
                const response = await originalFetch(...args);

                // Si la respuesta no es OK (ej. 400, 500), lo registramos automáticamente
                if (!response.ok) {
                    analytics.errorOccurred(
                        'HTTP_ERROR',
                        `Error ${response.status} (${response.statusText}) en ${url}`,
                        window.location.pathname,
                        user?.id
                    ).catch(() => {});
                }

                return response;
            } catch (error) {
                // Si hay un fallo de red o conexión total (TypeError: Failed to fetch)
                analytics.errorOccurred(
                    'NETWORK_ERROR',
                    error instanceof Error ? error.message : String(error),
                    window.location.pathname,
                    user?.id
                ).catch(() => {});
                
                throw error;
            }
        };

        // --- ERRORES DE JAVASCRIPT Y PROMESAS NO CAPTURADAS ---
        const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
            const reason = event.reason;
            const message = reason instanceof Error ? reason.message : String(reason);

            analytics.errorOccurred('UNHANDLED_PROMISE', message, window.location.pathname, user?.id).catch(() => {});
        };

        const handleError = (event: ErrorEvent) => {
            analytics.errorOccurred('GLOBAL_JS_ERROR', event.message || 'Error desconocido', window.location.pathname, user?.id).catch(() => {});
        };

        window.addEventListener('unhandledrejection', handleUnhandledRejection);
        window.addEventListener('error', handleError);

        // Cleanup al desmontar
        return () => {
            window.fetch = originalFetch; // Restauramos el fetch original
            window.removeEventListener('unhandledrejection', handleUnhandledRejection);
            window.removeEventListener('error', handleError);
        };
    }, [user?.id]);

    return null;
}