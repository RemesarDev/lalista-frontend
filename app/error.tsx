// app/error.tsx
'use client';

import { useEffect } from 'react';
import { analytics } from '@/app/_lib/services/analyticsService';
import { Button } from '@/app/_components/global/Button';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // 🚀 Registramos el error crítico de UI automáticamente en las métricas
    analytics.errorOccurred(
      'UI_CRASH', 
      error.message || 'Error de renderizado desconocido', 
      'root-error-boundary'
    ).catch(console.error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 py-10 text-center">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-sm border border-slate-200">
        <h2 className="text-2xl font-bold text-slate-900">Algo salió mal</h2>
        <p className="mt-2 text-sm text-slate-600 mb-6">
          Hubo un problema inesperado. Ya hemos registrado este inconveniente para solucionarlo.
        </p>
        
        <Button 
          variant="primary" 
          fullWidth 
          onClick={() => reset()}
          className="rounded-2xl"
        >
          Intentar de nuevo
        </Button>
      </div>
    </div>
  );
}