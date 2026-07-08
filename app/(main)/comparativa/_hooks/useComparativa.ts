'use client';
import { useState, useEffect } from 'react';
import { Producto } from '@/app/_types/productos';
import { client } from '@/app/_lib/hono-client';
import { useListaStore } from '@/app/_store/store';

export const useComparativa = (ids: string[]) => {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [cargando, setCargando] = useState<boolean>(false);
  const [hidratado, setHidratado] = useState(false);

  const { ubicacion } = useListaStore();

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

  useEffect(() => {
    // 1. Extraemos y validamos
    const lat = ubicacion.latitud;
    const lng = ubicacion.longitud;
    const rad = ubicacion.radioBusqueda;

    // 2. Si alguna es null/undefined/0, salimos. 
    // TypeScript ahora sabe que lat, lng y rad no son nulos aquí.
    if (!hidratado || ids.length === 0 || !lat || !lng) {
      if (productos.length > 0) setProductos([]);
      return;
    }

    const controller = new AbortController();
    let cancelado = false;

    const fetchPrecios = async () => {
      setCargando(true);
      try {
        // 3. Ahora usamos las variables locales que ya validamos
    const res = await client.api['precios-por-ids-area'].$get({
    query: {
        ids: ids.join(','), 
        lat: lat.toString(),
        lng: lng.toString(),
        radio: (rad ?? 5).toString(),
    },
    }, { init: { signal: controller.signal } });

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
  }, [
    ids.join(','),
    hidratado, 
    ubicacion.latitud, 
    ubicacion.longitud, 
    ubicacion.radioBusqueda
  ]);

  return { productos, cargando };
};