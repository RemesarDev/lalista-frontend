// app/(main)/mis-listas/_hooks/useMisListas.ts
'use client';

import { useState, useEffect } from 'react';
import type { ListaCompras } from '@/app/_types/listas';
import { avisar } from '@/app/_lib/avisos';

interface UseMisListasReturn {
  listas: ListaCompras[];
  cargando: boolean;
  error: string | null;
  recargar: () => void;
  eliminarLista: (id: string) => void;
}

export function useMisListas(userId: string | null): UseMisListasReturn {
  const [listas, setListas] = useState<ListaCompras[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!userId) return;

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
  }, [userId, tick]);

  const recargar = () => setTick((t) => t + 1);

  const eliminarLista = (id: string) => {
    const backup = listas;
    const lista = listas.find((l) => l.id === id);
    // Si no es tuya, "eliminar" en realidad es salir de la lista compartida.
    const esPropia = !lista || lista.rol === 'owner';
    setListas((prev) => prev.filter((l) => l.id !== id));

    fetch(`/api/listas/${id}`, { method: 'DELETE', credentials: 'include' })
      .then((res) => {
        if (!res.ok) throw new Error();
        if (lista) {
          avisar.exito(esPropia ? `Borraste la lista ${lista.nombre}` : `Saliste de la lista ${lista.nombre}`);
        }
      })
      .catch(() => {
        setListas(backup);
        avisar.error(
          esPropia
            ? 'No pudimos borrar la lista. Probá de nuevo.'
            : 'No pudimos sacarte de la lista. Probá de nuevo.'
        );
      });
  };

  return { listas, cargando, error, recargar, eliminarLista };
}