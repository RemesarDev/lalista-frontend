'use client';

import { useEffect } from 'react';
import { analytics } from '@/app/_lib/services/analyticsService';
import { WarningCircle, ArrowClockwise } from '@phosphor-icons/react/dist/ssr';

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Registramos automáticamente el error de renderizado en la Base de Datos 2
        analytics.errorOccurred(
            'REACT_RENDER_ERROR',
            error.message || 'Error desconocido en componente UI',
            window.location.pathname
        ).catch(console.error);
    }, [error]);

    return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
            <div className="p-4 bg-red-500/10 text-red-500 rounded-full mb-4 border border-red-500/20">
                <WarningCircle size={36} weight="bold" />
            </div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">¡Vaya! Algo salió mal en esta vista.</h2>
            <p className="text-sm text-slate-600 max-w-md mb-6">
                Hemos registrado este problema técnico automáticamente para solucionarlo a la brevedad.
            </p>
            <button
                onClick={() => reset()}
                className="bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg px-4 py-2 text-sm transition-colors flex items-center space-x-2 shadow-md shadow-orange-500/20"
            >
                <ArrowClockwise size={16} weight="bold" />
                <span>Intentar nuevamente</span>
            </button>
        </div>
    );
}