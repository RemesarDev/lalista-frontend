// app/(main)/mis-listas/_hooks/useMisListas.ts
'use client';

import { useState, useEffect } from 'react';
import type { ListaCompras } from '@/app/_types/listas';

interface UseMisListasReturn {
  listas: ListaCompras[];
  cargando: boolean;
  error: string | null;
  recargar: () => void;
}

export function useMisListas(userId: string | null): UseMisListasReturn {
  const [listas, setListas] = useState<ListaCompras[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!userId) return; // 👈 espera a que haya usuario

    let mounted = true;

    const fetchListas = async () => {
      setCargando(true);
      setError(null);

      try {
        const res = await fetch('/api/listas', { credentials: 'include' });
        if (!res.ok) {
          const json = await res.json();
          throw new Error(json.error ?? 'Error al cargar las listas');
        }
        const json = await res.json();
        if (mounted) setListas(json.listas ?? []);
      } catch (err: any) {
        if (mounted) setError(err.message ?? 'Error inesperado');
      } finally {
        if (mounted) setCargando(false);
      }
    };

    fetchListas();
    return () => { mounted = false; };
  }, [userId, tick]); // 👈 userId como dependencia

  const recargar = () => setTick((t) => t + 1);

  return { listas, cargando, error, recargar };
}