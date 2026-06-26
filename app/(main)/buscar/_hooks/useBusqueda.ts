import { useState, useEffect } from 'react';
import { Producto, BusquedaResponse } from '../_types';
import { client } from '@/app/_lib/hono-client';
import { useListaStore } from '@/app/_store/store';

export const useBusqueda = (query: string = "") => {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [cargando, setCargando] = useState<boolean>(false);
  const { ubicacion } = useListaStore();

  useEffect(() => {
    if (!query || query.trim().length < 3) return;

    const controller = new AbortController();
    let cancelado = false;

    const fetchProductos = async () => {
      setCargando(true);
      try {
        let res;

        if (ubicacion.latitud && ubicacion.longitud) {
          res = await client.api.productos.$get({ 
            query: { 
              search: query,
              lat: ubicacion.latitud.toString(),
              lng: ubicacion.longitud.toString(),
              radio: ubicacion.radioBusqueda.toString(),
            } 
          });
        } else {
          res = await client.api.catalogo.$get({ 
            query: { search: query } 
          });
        }

        // Si este efecto ya fue cancelado por uno más nuevo, ignoramos la respuesta
        if (cancelado) return;

        if (!res.ok) throw new Error("Error en la respuesta del servidor");
        
        const data = (await res.json()) as BusquedaResponse;
        
        if (data && Array.isArray(data.productos)) {
          setProductos(data.productos);
        } else {
          setProductos([]);
        }
        
      } catch (error) {
        if (cancelado) return; // ignoramos errores de requests viejos también
        console.error("Error al buscar productos:", error);
        setProductos([]);
      } finally {
        if (!cancelado) setCargando(false);
      }
    };

    fetchProductos();

    // Cuando el efecto se re-ejecuta (nuevo query), esto cancela el anterior
    return () => {
      cancelado = true;
      controller.abort();
    };
  }, [query, ubicacion.latitud, ubicacion.longitud, ubicacion.radioBusqueda]);

  return { productos, cargando };
};