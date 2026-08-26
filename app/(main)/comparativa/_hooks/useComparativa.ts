'use client';

import { useState, useEffect } from 'react';
import { Producto } from '@/app/_types/productos';
import { client } from '@/app/_lib/hono-client';
import { useListaStore } from '@/app/_store/store';

export const useComparativa = (ids: string[]) => {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [cargando, setCargando] = useState<boolean>(false);
  const [hidratado, setHidratado] = useState(false);

  // Extraemos únicamente sucursalesIds del Store
  const { sucursalesIds } = useListaStore();

  useEffect(() => {
    if (useListaStore.persist.hasHydrated()) {
      setHidratado(true);
    } else {
      const unsub = useListaStore.persist.onFinishHydration(() => {
        setHidratado(true);
      });
      return unsub;
    }
  }, []);

  const idsClave = ids.join(',');
  const sucursalesClave = sucursalesIds.join(',');

  useEffect(() => {
    // Si no está hidratado, no hay IDs de productos o no hay sucursales disponibles, limpiamos y salimos.
    if (!hidratado || ids.length === 0 || sucursalesIds.length === 0) {
      if (productos.length > 0) setProductos([]);
      return;
    }

    const controller = new AbortController();
    let cancelado = false;

    const fetchPrecios = async () => {
      setCargando(true);
      try {
        const res = await client.api['precios-por-ids-area'].$get(
          {
            query: {
              ids: idsClave,
              sucursales_ids: sucursalesClave,
            },
          },
          { init: { signal: controller.signal } }
        );

        if (cancelado) return;

        if (!res.ok) throw new Error(`Error ${res.status}`);

        const data = await res.json();

        if (data?.productos && Array.isArray(data.productos)) {
          setProductos(data.productos);
        } else {
          setProductos([]);
        }
      } catch (error) {
        if (!cancelado && !(error instanceof Error && error.name === 'AbortError')) {
          console.error('Error obteniendo precios comparativos:', error);
          setProductos([]);
        }
      } finally {
        if (!cancelado) setCargando(false);
      }
    };

    fetchPrecios();

    return () => {
      cancelado = true;
      controller.abort();
    };
  }, [idsClave, sucursalesClave, hidratado]);

  return { productos, cargando };
};