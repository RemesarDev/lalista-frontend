import { useState, useEffect } from 'react';
import { Producto, BusquedaResponse } from '../_types';
import { client } from '@/app/_lib/hono-client';
import { useListaStore } from '@/app/_store/store';

export const useBusqueda = (query: string = "") => {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [cargando, setCargando] = useState<boolean>(false);
  const { ubicacion } = useListaStore();

  useEffect(() => {
    const termino = query.trim();
    if (termino.length < 3) {
      setProductos([]);
      setCargando(false);
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
          });
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
        } else {
          setProductos([]);
        }

      } catch (error) {
        if (cancelado) return;
        console.error('Error al buscar productos:', error);
        setProductos([]);
      } finally {
        if (!cancelado) setCargando(false);
      }
    };

    fetchProductos();

    return () => {
      cancelado = true;
      controller.abort();
    };
  }, [query, ubicacion.latitud, ubicacion.longitud, ubicacion.radioBusqueda]);

  return { productos, cargando };
};