'use client';
import { useState, useEffect, useCallback } from 'react';
import { Producto, BusquedaResponse } from '@/app/_types/productos';
import { client } from '@/app/_lib/hono-client';
import { useListaStore } from '@/app/_store/store';

export const useBusqueda = (query: string = "") => {
  const termino = query.trim();
  const [productos, setProductos] = useState<Producto[]>([]);
  const [cargando, setCargando] = useState<boolean>(false);
  const [cargandoMas, setCargandoMas] = useState<boolean>(false);
  const [pagina, setPagina] = useState<number>(1);
  const [hayMas, setHayMas] = useState<boolean>(false);

  const { ubicacion, guardarCacheBusquedaPrecios, limpiarCacheBusquedaPrecios } = useListaStore();
  const [hidratado, setHidratado] = useState(false);

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

  // Búsqueda inicial (Página 1) al cambiar término o ubicación
  useEffect(() => {
    if (!hidratado || termino.length < 3) {
      if (termino.length < 3) {
        setProductos([]);
        setHayMas(false);
        limpiarCacheBusquedaPrecios();
      }
      return;
    }

    const controller = new AbortController();
    let cancelado = false;

    const fetchProductos = async () => {
      setCargando(true);
      setPagina(1); // Reiniciar a la primera página

      try {
        const initOpts = { init: { signal: controller.signal } };

        const queryParams = {
          search: termino,
          page: '1',
          limit: '20',
          ...(ubicacion.latitud && ubicacion.longitud ? {
            lat: ubicacion.latitud.toString(),
            lng: ubicacion.longitud.toString(),
            radio: ubicacion.radioBusqueda.toString(),
          } : {})
        };

        const res = (ubicacion.latitud && ubicacion.longitud) 
          ? await client.api.productos.$get({ query: queryParams as any }, initOpts)
          : await client.api.catalogo.$get({ query: { search: termino, page: '1', limit: '20' } }, initOpts);

        if (cancelado) return;
        if (!res.ok) throw new Error(`Status: ${res.status}`);

        const data = (await res.json()) as BusquedaResponse & { hasMore?: boolean };

        if (data?.productos && Array.isArray(data.productos)) {
          setProductos(data.productos);
          setHayMas(!!data.hasMore);
          guardarCacheBusquedaPrecios({
            query: termino,
            latitud: ubicacion.latitud,
            longitud: ubicacion.longitud,
            radioBusqueda: ubicacion.radioBusqueda,
            productos: data.productos,
          });
        } else {
          setProductos([]);
          setHayMas(false);
          limpiarCacheBusquedaPrecios();
        }
      } catch (error) {
        if (!cancelado && !(error instanceof Error && error.name === 'AbortError')) {
          console.error('Error en búsqueda:', error);
          setProductos([]);
          setHayMas(false);
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

  // Función para cargar la siguiente página (Scroll Infinito)
  const cargarMas = useCallback(async () => {
    if (cargando || cargandoMas || !hayMas || termino.length < 3) return;

    setCargandoMas(true);
    const siguientePagina = pagina + 1;

    try {
      const queryParams = {
        search: termino,
        page: siguientePagina.toString(),
        limit: '20',
        ...(ubicacion.latitud && ubicacion.longitud ? {
          lat: ubicacion.latitud.toString(),
          lng: ubicacion.longitud.toString(),
          radio: ubicacion.radioBusqueda.toString(),
        } : {})
      };

      const res = (ubicacion.latitud && ubicacion.longitud)
        ? await client.api.productos.$get({ query: queryParams as any })
        : await client.api.catalogo.$get({ query: { search: termino, page: siguientePagina.toString(), limit: '20' } });

      if (!res.ok) throw new Error(`Status: ${res.status}`);

      const data = (await res.json()) as BusquedaResponse & { hasMore?: boolean };

      if (data?.productos && Array.isArray(data.productos)) {
        setProductos((prev) => [...prev, ...data.productos]);
        setPagina(siguientePagina);
        setHayMas(!!data.hasMore);
      }
    } catch (error) {
      console.error('Error al cargar más resultados:', error);
    } finally {
      setCargandoMas(false);
    }
  }, [cargando, cargandoMas, hayMas, pagina, termino, ubicacion]);

  return { 
    productos: termino.length < 3 ? [] : productos, 
    cargando: termino.length < 3 ? false : cargando,
    cargandoMas,
    hayMas,
    cargarMas
  };
};