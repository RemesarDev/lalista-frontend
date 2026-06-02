// app/(main)/buscar/_hooks/useBusqueda.ts
import { useState, useEffect } from 'react';
import { Producto } from '../_types';
import { client } from '@/app/_lib/hono-client';

export const useBusqueda = (query: string = "") => {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [cargando, setCargando] = useState<boolean>(false);

  useEffect(() => {
    if (!query || query.length < 3) {
      setProductos([]);
      return;
    }

    const fetchProductos = async () => {
      setCargando(true);
      try {
        const res = await client.api.productos.$get({ query: { search: query } });
        const data = await res.json();
        
        if (data && 'productos' in data) {
          setProductos(data.productos as Producto[]);
        }
        
      } catch (error) {
        console.error("Error al buscar productos:", error);
      } finally {
        setCargando(false);
      }
    };

    fetchProductos();
  }, [query]);

  return { productos, cargando };
};