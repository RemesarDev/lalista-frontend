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

  const { sucursalesIds, guardarCacheBusquedaPrecios, limpiarCacheBusquedaPrecios } = useListaStore();
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

  const tieneSucursales = sucursalesIds && sucursalesIds.length > 0;

  // Búsqueda inicial (Página 1)
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

    const fetchProductos = async (reintentos = 2): Promise<void> => {
      setCargando(true);
      setPagina(1);

      try {
        const initOpts = { init: { signal: controller.signal } };

        const res = tieneSucursales
          ? await client.api.productos.$get({
              query: {
                search: termino,
                page: '1',
                limit: '20',
                sucursales_ids: sucursalesIds.join(','),
              }
            }, initOpts)
          : await client.api.catalogo.$get({
              query: { search: termino, page: '1', limit: '20' }
            }, initOpts);

        if (cancelado) return;

        if (!res.ok) {
          if (reintentos > 0) {
            await new Promise((r) => setTimeout(r, 800));
            if (!cancelado) return fetchProductos(reintentos - 1);
          }
          throw new Error(`Status: ${res.status}`);
        }

        const data = (await res.json()) as BusquedaResponse & { hasMore?: boolean };

        if (data?.productos && Array.isArray(data.productos)) {
          setProductos(data.productos);
          setHayMas(!!data.hasMore);
          
          const ubi = useListaStore.getState().ubicacion;
          guardarCacheBusquedaPrecios({
            query: termino,
            latitud: ubi.latitud,
            longitud: ubi.longitud,
            radioBusqueda: ubi.radioBusqueda,
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
    sucursalesIds,
    tieneSucursales,
    guardarCacheBusquedaPrecios,
    limpiarCacheBusquedaPrecios
  ]);

  // Carga para Scroll Infinito
  const cargarMas = useCallback(async () => {
    if (cargando || cargandoMas || !hayMas || termino.length < 3) return;

    setCargandoMas(true);
    const siguientePagina = pagina + 1;

    try {
      const res = tieneSucursales
        ? await client.api.productos.$get({
            query: {
              search: termino,
              page: siguientePagina.toString(),
              limit: '20',
              sucursales_ids: sucursalesIds.join(','),
            }
          })
        : await client.api.catalogo.$get({
            query: { search: termino, page: siguientePagina.toString(), limit: '20' }
          });

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
  }, [cargando, cargandoMas, hayMas, pagina, termino, sucursalesIds, tieneSucursales]);

  return { 
    productos: termino.length < 3 ? [] : productos, 
    cargando: termino.length < 3 ? false : cargando,
    cargandoMas,
    hayMas,
    cargarMas
  };
};