'use client';

import { useState, useEffect, useMemo } from 'react';
import { client } from '@/app/_lib/hono-client';
import { useListaStore, type SucursalBusqueda } from '@/app/_store/store';

export interface ProductoComparativa {
  id: string;
  nombre?: string;
  sucursales: SucursalBusqueda[];
}

export const useComparativa = (ids: string[]) => {
  const [productos, setProductos] = useState<ProductoComparativa[]>([]);
  const [cargando, setCargando] = useState<boolean>(false);
  const [hidratado, setHidratado] = useState(false);

  // 1. Extraemos las propiedades exactas definidas en UbicacionSlice
  const ubicacion = useListaStore((state) => state.ubicacion);
  const sucursalesCercanas = useListaStore((state) => state.sucursalesCercanas);
  const sucursalesIdsStore = useListaStore((state) => state.sucursalesIds);

  // 2. Derivamos los IDs (usando sucursalesIds del store o extrayéndolos de id_unico / id_comercio)
  const sucursalesIds = useMemo(() => {
    if (sucursalesIdsStore && sucursalesIdsStore.length > 0) {
      return sucursalesIdsStore;
    }
    return sucursalesCercanas ? sucursalesCercanas.map((s) => s.id_unico || `${s.id_comercio}-${s.id_bandera}`) : [];
  }, [sucursalesIdsStore, sucursalesCercanas]);

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

  // 3. Mapeamos latitud y longitud desde ubicacion
  const lat = ubicacion?.latitud != null ? String(ubicacion.latitud) : undefined;
  const lng = ubicacion?.longitud != null ? String(ubicacion.longitud) : undefined;

  useEffect(() => {
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
              lat,
              lng,
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
  }, [idsClave, sucursalesClave, lat, lng, hidratado]);

  return { productos, cargando };
};