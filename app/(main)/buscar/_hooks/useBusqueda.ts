// app/(main)/buscar/_hooks/useBusqueda.ts
import { useState, useEffect } from 'react';
import { Producto, BusquedaResponse } from '../_types';
import { client } from '@/app/_lib/hono-client';

export const useBusqueda = (query: string = "") => {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [cargando, setCargando] = useState<boolean>(false);

  useEffect(() => {
    // 1. Limpieza de estado si la búsqueda es muy corta o vacía
    if (!query || query.trim().length < 3) {
      setProductos([]);
      return;
    }

    const fetchProductos = async () => {
      setCargando(true);
      try {
        // Hacemos el llamado a la API usando el cliente de Hono
        const res = await client.api.productos.$get({ query: { search: query } });
        
        // 2. Verificación de éxito de la respuesta HTTP
        if (!res.ok) throw new Error("Error en la respuesta del servidor");
        
        // 3. Tipamos la respuesta explícitamente con BusquedaResponse
        const data = (await res.json()) as BusquedaResponse;
        
        // 4. Asignación segura del estado
        if (data && Array.isArray(data.productos)) {
          setProductos(data.productos);
        } else {
          setProductos([]);
        }
        
      } catch (error) {
        console.error("Error al buscar productos:", error);
        setProductos([]); // Limpiamos el estado en caso de error para evitar inconsistencias
      } finally {
        setCargando(false);
      }
    };

    fetchProductos();
  }, [query]);

  return { productos, cargando };
};