'use client';

import { useState, useEffect, useMemo } from 'react';
import { client } from '@/app/_lib/hono-client';
import { useListaStore, type SucursalBusqueda } from '@/app/_store/store';

// Estructura que devuelve el endpoint de comparativa
export interface ProductoComparativa {
  id: string;
  nombre?: string;
  sucursales: SucursalBusqueda[];
}

export const useComparativa = (ids: string[]) => {
  const [productos, setProductos] = useState<ProductoComparativa[]>([]);
  const [cargando, setCargando] = useState<boolean>(false);
  const [hidratado, setHidratado] = useState(false);

  // Extraemos las sucursales cercanas de la ubicación actual del usuario desde el store
  const sucursalesCercanas = useListaStore((state) => state.sucursalesCercanas);

  // Derivamos los IDs de sucursales para la consulta HTTP
  const sucursalesIds = useMemo(
    () => (sucursalesCercanas ? sucursalesCercanas.map((s) => s.id_comercio || s.id_bandera) : []),
    [sucursalesCercanas]
  );

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
    // Si no se ha hidratado, o no hay IDs de productos o sucursales, reseteamos y evitamos el fetch.
    if (!hidratado || !idsClave || !sucursalesClave) {
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

        if (!res.ok) throw new Error(`Error HTTP ${res.status}`);

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