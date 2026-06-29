import { useState, useEffect } from 'react';
import { Producto, BusquedaResponse } from '../_types';
import { client } from '@/app/_lib/hono-client';
import { useListaStore } from '@/app/_store/store';

export const useBusqueda = (query: string = "") => {
  const termino = query.trim();
  const [productos, setProductos] = useState<Producto[]>([]);
  const [cargando, setCargando] = useState<boolean>(false);

  // 1. Traemos la ubicación y las funciones de caché del store (Feature)
  const {
    ubicacion,
    guardarCacheBusquedaPrecios,
    limpiarCacheBusquedaPrecios,
  } = useListaStore();
  
  // 2. Control de hidratación de Zustand para evitar falsos arranques (Main)
  const [hidratado, setHidratado] = useState(
    () => useListaStore.persist.hasHydrated()
  );

  useEffect(() => {
    if (!hidratado) {
      const unsub = useListaStore.persist.onFinishHydration(() => {
        setHidratado(true);
      });
      return unsub;
    }
  }, [hidratado]);

  // 3. Efecto de búsqueda unificado
  useEffect(() => {
    // Si no está hidratado o la query es corta, no hacemos la petición HTTP
    if (!hidratado) return;
    if (termino.length < 3) {
      // Si el usuario borra la búsqueda, limpiamos la caché (Feature)
      limpiarCacheBusquedaPrecios();
      return;
    }

    const controller = new AbortController();
    let cancelado = false;

    const fetchProductos = async () => {
      setCargando(true);
      try {
        let res;
        if (ubicacion.latitud && ubicacion.longitud) {
          res = await client.api.productos.$get({
            query: {
              search: termino,
              lat: ubicacion.latitud.toString(),
              lng: ubicacion.longitud.toString(),
              radio: ubicacion.radioBusqueda.toString(),
            },
          }, { init: { signal: controller.signal } }); // Abort real a nivel de red
        } else {
          res = await client.api.catalogo.$get({
            query: { search: termino },
          });
        }

        if (cancelado) return;
        if (!res.ok) throw new Error('Error en la respuesta del servidor');

        const data = (await res.json()) as BusquedaResponse;
        if (data && Array.isArray(data.productos)) {
          setProductos(data.productos);
          // Guardamos en caché si la respuesta es exitosa (Feature)
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
        if (cancelado) return;
        if (error instanceof Error && error.name === 'AbortError') return; // Ignorar si fue cancelado adrede
        console.error('Error al buscar productos:', error);
        setProductos([]);
        limpiarCacheBusquedaPrecios();
      } finally {
        if (!cancelado) setCargando(false);
      }
    };

    fetchProductos();

    return () => {
      cancelado = true;
      controller.abort();
    };
  // Incluimos todas las dependencias necesarias de forma limpia
  }, [
    termino, 
    ubicacion.latitud, 
    ubicacion.longitud, 
    ubicacion.radioBusqueda, 
    hidratado, 
    guardarCacheBusquedaPrecios, 
    limpiarCacheBusquedaPrecios
  ]);

  // 4. Formateo de salida limpia que venía de Main
  const productosFinal = termino.length < 3 ? [] : productos;
  const cargandoFinal = termino.length < 3 ? false : cargando;

  return { productos: productosFinal, cargando: cargandoFinal };
};