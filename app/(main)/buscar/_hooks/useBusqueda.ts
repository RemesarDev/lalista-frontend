'use client';

import { useState, useEffect, useCallback } from 'react';
import { Producto, BusquedaResponse } from '@/app/_types/productos';
import { client } from '@/app/_lib/hono-client';
import { useListaStore } from '@/app/_store/store';

export const useBusqueda = (
  query: string = "",
  categoria: string = "",
  etiquetas: string[] = []
) => {
  const termino = query.trim();

  // Se serializan para poder usarlas como dependencia del efecto sin que un
  // array nuevo en cada render dispare una busqueda de mas.
  const etiquetasParam = etiquetas.join(',');

  // Antes hacia falta un termino de 3 letras. Ahora tambien alcanza con haber
  // elegido una categoria o una etiqueta: es lo que permite navegar el catalogo
  // sin escribir nada.
  const hayFiltro = termino.length >= 3 || categoria !== '' || etiquetasParam !== '';
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
    if (!hidratado || !hayFiltro) {
      if (!hayFiltro) {
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

        const filtros = {
          ...(termino.length >= 3 ? { search: termino } : {}),
          ...(categoria ? { categoria } : {}),
          ...(etiquetasParam ? { etiquetas: etiquetasParam } : {}),
        };

        const res = tieneSucursales
          ? await client.api.productos.$get({
              query: {
                ...filtros,
                page: '1',
                limit: '20',
                sucursales_ids: sucursalesIds.join(','),
              } as any
            }, initOpts)
          : await client.api.catalogo.$get({
              query: { ...filtros, page: '1', limit: '20' } as any
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
            query: termino || categoria || etiquetasParam,
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
    categoria,
    etiquetasParam,
    hayFiltro,
    hidratado, 
    sucursalesIds,
    tieneSucursales,
    guardarCacheBusquedaPrecios,
    limpiarCacheBusquedaPrecios
  ]);

  // Carga para Scroll Infinito
  const cargarMas = useCallback(async () => {
    if (cargando || cargandoMas || !hayMas || !hayFiltro) return;

    setCargandoMas(true);
    const siguientePagina = pagina + 1;

    try {
      const filtros = {
        ...(termino.length >= 3 ? { search: termino } : {}),
        ...(categoria ? { categoria } : {}),
        ...(etiquetasParam ? { etiquetas: etiquetasParam } : {}),
      };

      const res = tieneSucursales
        ? await client.api.productos.$get({
            query: {
              ...filtros,
              page: siguientePagina.toString(),
              limit: '20',
              sucursales_ids: sucursalesIds.join(','),
            } as any
          })
        : await client.api.catalogo.$get({
            query: { ...filtros, page: siguientePagina.toString(), limit: '20' } as any
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
  }, [cargando, cargandoMas, hayMas, hayFiltro, pagina, termino, categoria,
      etiquetasParam, sucursalesIds, tieneSucursales]);

  return { 
    productos: !hayFiltro ? [] : productos, 
    cargando: !hayFiltro ? false : cargando,
    cargandoMas,
    hayMas,
    cargarMas
  };
};