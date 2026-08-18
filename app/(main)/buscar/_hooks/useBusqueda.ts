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

  // Helper para validar si la ubicación geográfica es segura y válida
  const tieneUbicacionValida = useCallback(() => {
    const lat = Number(ubicacion.latitud);
    const lng = Number(ubicacion.longitud);
    return (
      ubicacion.latitud !== null &&
      ubicacion.longitud !== null &&
      !isNaN(lat) &&
      !isNaN(lng) &&
      lat !== 0 &&
      lng !== 0
    );
  }, [ubicacion.latitud, ubicacion.longitud]);

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

    // Función interna con reintento para tolerar el cold-start de la DB
    const fetchProductos = async (reintentos = 2): Promise<void> => {
      setCargando(true);
      setPagina(1);

      try {
        const initOpts = { init: { signal: controller.signal } };
        const usaGps = tieneUbicacionValida();

        const queryParams = {
          search: termino,
          page: '1',
          limit: '20',
          ...(usaGps ? {
            lat: ubicacion.latitud!.toString(),
            lng: ubicacion.longitud!.toString(),
            radio: (ubicacion.radioBusqueda || 5).toString(),
          } : {})
        };

        const res = usaGps 
          ? await client.api.productos.$get({ query: queryParams as any }, initOpts)
          : await client.api.catalogo.$get({ query: { search: termino, page: '1', limit: '20' } }, initOpts);

        if (cancelado) return;

        // Si dio error 500 y tenemos reintentos disponibles (ej. cold start)
        if (!res.ok) {
          if (reintentos > 0) {
            await new Promise((r) => setTimeout(r, 800)); // Esperar 800ms antes de reintentar
            if (!cancelado) return fetchProductos(reintentos - 1);
          }
          throw new Error(`Status: ${res.status}`);
        }

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
    ubicacion.radioBusqueda,
    tieneUbicacionValida,
    guardarCacheBusquedaPrecios,
    limpiarCacheBusquedaPrecios
  ]);

  // Función para cargar la siguiente página (Scroll Infinito)
  const cargarMas = useCallback(async () => {
    if (cargando || cargandoMas || !hayMas || termino.length < 3) return;

    setCargandoMas(true);
    const siguientePagina = pagina + 1;

    try {
      const usaGps = tieneUbicacionValida();

      const queryParams = {
        search: termino,
        page: siguientePagina.toString(),
        limit: '20',
        ...(usaGps ? {
          lat: ubicacion.latitud!.toString(),
          lng: ubicacion.longitud!.toString(),
          radio: (ubicacion.radioBusqueda || 5).toString(),
        } : {})
      };

      const res = usaGps
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
  }, [cargando, cargandoMas, hayMas, pagina, termino, ubicacion, tieneUbicacionValida]);

  return { 
    productos: termino.length < 3 ? [] : productos, 
    cargando: termino.length < 3 ? false : cargando,
    cargandoMas,
    hayMas,
    cargarMas
  };
};