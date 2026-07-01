'use client';
import { useState, useEffect} from 'react';
import { Producto, BusquedaResponse } from '../_types';
import { client } from '@/app/_lib/hono-client';
import { useListaStore } from '@/app/_store/store';

export const useBusqueda = (query: string = "") => {
  const termino = query.trim();
  const [productos, setProductos] = useState<Producto[]>([]);
  const [cargando, setCargando] = useState<boolean>(false);
  
  // Extraemos solo lo necesario del store
  const { ubicacion, guardarCacheBusquedaPrecios, limpiarCacheBusquedaPrecios } = useListaStore();
  
const [hidratado, setHidratado] = useState(false);

  useEffect(() => {
    // Si ya está hidratado, setea true inmediatamente
    if (useListaStore.persist.hasHydrated()) {
      setHidratado(true);
    } else {
      // Si no, nos suscribimos al evento que SÍ existe en tu tipo
      const unsub = useListaStore.persist.onFinishHydration(() => {
        setHidratado(true);
      });
      return unsub;
    }
  }, []);

  useEffect(() => {
    // Si no está hidratado o el término es muy corto, no hacemos nada
    if (!hidratado || termino.length < 3) {
      if (termino.length < 3) limpiarCacheBusquedaPrecios();
      return;
    }

    const controller = new AbortController();
    let cancelado = false;

    const fetchProductos = async (intentos = 1) => {
      setCargando(true);
      try {
        const initOpts = { init: { signal: controller.signal } };
        
        // Ejecución de la consulta según disponibilidad de ubicación
        const res = (ubicacion.latitud && ubicacion.longitud) 
          ? await client.api.productos.$get({
              query: {
                search: termino,
                lat: ubicacion.latitud.toString(),
                lng: ubicacion.longitud.toString(),
                radio: ubicacion.radioBusqueda.toString(),
              },
            }, initOpts)
          : await client.api.catalogo.$get({ query: { search: termino } }, initOpts);

        if (cancelado) return;

        if (!res.ok) {
          const textoError = await res.text().catch(() => 'Error desconocido');
          const esTimeout = textoError.includes('57014') || textoError.includes('timeout');
          
          if (esTimeout && intentos > 0) return fetchProductos(intentos - 1);
          throw new Error(`Status: ${res.status}`);
        }

        const data = (await res.json()) as BusquedaResponse;
        
        if (data?.productos && Array.isArray(data.productos)) {
          setProductos(data.productos);
          guardarCacheBusquedaPrecios({
            query: termino,
            latitud: ubicacion.latitud,
            longitud: ubicacion.longitud,
            radioBusqueda: ubicacion.radioBusqueda,
            productos: data.productos,
          });
        } else {
          setProductos([]);
          limpiarCacheBusquedaPrecios();
        }
      } catch (error) {
        if (!cancelado && !(error instanceof Error && error.name === 'AbortError')) {
          console.error('Error en búsqueda:', error);
          setProductos([]);
          limpiarCacheBusquedaPrecios();
        }
      } finally {
        if (!cancelado) setCargando(false);
      }
    };

    fetchProductos();

    return () => {
      cancelado = true;
      controller.abort();
    };
  }, [
    termino, 
    hidratado, 
    ubicacion.latitud, 
    ubicacion.longitud, 
    ubicacion.radioBusqueda
  ]);

  return { 
    productos: termino.length < 3 ? [] : productos, 
    cargando: termino.length < 3 ? false : cargando 
  };
};