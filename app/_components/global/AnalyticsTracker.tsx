// app/_components/global/AnalyticsTracker.tsx
'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { analytics } from '@/app/_lib/services/analyticsService';
import { useListaStore } from '@/app/_store/store';

export function AnalyticsTracker() {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const user = useListaStore((state) => state.user);

    // 1. Rastreo de visitas a páginas (Page Views)
    useEffect(() => {
        if (!pathname) return;
        const queryStr = searchParams?.toString();
        const fullPath = queryStr ? `${pathname}?${queryStr}` : pathname;

        analytics.pageView(fullPath, user?.id).catch(console.error);
    }, [pathname, searchParams, user?.id]);

    // 2. Escucha global de errores de cliente y promesas no manejadas
    useEffect(() => {
        const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
            const reason = event.reason;
            const message = reason instanceof Error ? reason.message : String(reason);

            analytics.errorOccurred(
                'UNHANDLED_PROMISE',
                message,
                window.location.pathname,
                user?.id
            ).catch(console.error);
        };

        const handleError = (event: ErrorEvent) => {
            analytics.errorOccurred(
                'GLOBAL_JS_ERROR',
                event.message || 'Error de script desconocido',
                window.location.pathname,
                user?.id
            ).catch(console.error);
        };

        window.addEventListener('unhandledrejection', handleUnhandledRejection);
        window.addEventListener('error', handleError);

        return () => {
            window.removeEventListener('unhandledrejection', handleUnhandledRejection);
            window.removeEventListener('error', handleError);
        };
    }, [user?.id]);

    return null;
}