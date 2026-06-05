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

    if (!ubicacion.latitud || !ubicacion.longitud) {
      console.warn("No hay ubicación configurada");
      return;
    }

    const fetchProductos = async () => {
      setCargando(true);
      try {
        const res = await client.api.productos.$get({ 
          query: { 
            search: query,
            lat: ubicacion.latitud!.toString(),
            lng: ubicacion.longitud!.toString(),
            radio: ubicacion.radioBusqueda.toString(),
          } 
        });
        
        if (!res.ok) throw new Error("Error en la respuesta del servidor");
        
        const data = (await res.json()) as BusquedaResponse;
        
        if (data && Array.isArray(data.productos)) {
          setProductos(data.productos);
        } else {
          setProductos([]);
        }
        
      } catch (error) {
        console.error("Error al buscar productos:", error);
        setProductos([]);
      } finally {
        setCargando(false);
      }
    };

    fetchProductos();
  }, [query, ubicacion.latitud, ubicacion.longitud, ubicacion.radioBusqueda]);

  return { productos, cargando };
};