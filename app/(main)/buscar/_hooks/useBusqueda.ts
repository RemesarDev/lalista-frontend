import { useState, useEffect } from 'react';
import { Producto, BusquedaResponse } from '../_types';
import { client } from '@/app/_lib/hono-client';
import { useListaStore } from '@/app/_store/store';


export const useBusqueda = (query: string = "") => {
  const termino = query.trim();
  const [productos, setProductos] = useState<Producto[]>([]);
  const [cargando, setCargando] = useState<boolean>(false);

  // 1. Traemos la ubicación y las funciones de caché del store
  const {
    ubicacion,
    guardarCacheBusquedaPrecios,
    limpiarCacheBusquedaPrecios,
  } = useListaStore();
  
  // 2. Control de hidratación de Zustand para evitar falsos arranques
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
    if (!hidratado) return;
    if (termino.length < 3) {
      limpiarCacheBusquedaPrecios();
      return;
    }

    const controller = new AbortController();
    let cancelado = false;

    const fetchProductos = async () => {
      setCargando(true);
      try {
        let res;
        const initOpts = { init: { signal: controller.signal } };

        if (ubicacion.latitud && ubicacion.longitud) {
          res = await client.api.productos.$get({
            query: {
              search: termino,
              lat: ubicacion.latitud.toString(),
              lng: ubicacion.longitud.toString(),
              radio: ubicacion.radioBusqueda.toString(),
            },
          }, initOpts);
        } else {
          res = await client.api.catalogo.$get({
            query: { search: termino },
          }, initOpts);
        }

        if (cancelado) return;

        if (!res.ok) {
          const textoError = await res.text().catch(() => 'No se pudo leer la respuesta de error');
          console.error(`🚨 Error en API Hono (Status ${res.status}):`, textoError);
          throw new Error(`Error en la respuesta del servidor (Status: ${res.status})`);
        }

        const data = (await res.json()) as BusquedaResponse;
        if (data && Array.isArray(data.productos)) {
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
        if (cancelado) return;
        if (error instanceof Error && error.name === 'AbortError') return;
        
        console.error('Error al buscar productos:', error);
        setProductos([]);
        limpiarCacheBusquedaPrecios();
      } finally {
        if (!cancelado) setCargando(false);
      }
    };

    // 🛡️ CORRECCIÓN CLAVE: Ejecutamos la función asincrónica que acabamos de definir
    fetchProductos();

    // Limpieza del efecto para abortar peticiones si el usuario sigue tipeando
    return () => {
      cancelado = true;
      controller.abort();
    };
    
  }, [
    termino, 
    ubicacion.latitud, 
    ubicacion.longitud, 
    ubicacion.radioBusqueda, 
    hidratado, 
    guardarCacheBusquedaPrecios, 
    limpiarCacheBusquedaPrecios
  ]);

  // 4. Formateo de salida limpia
  const productosFinal = termino.length < 3 ? [] : productos;
  const cargandoFinal = termino.length < 3 ? false : cargando;

  return { productos: productosFinal, cargando: cargandoFinal };
};