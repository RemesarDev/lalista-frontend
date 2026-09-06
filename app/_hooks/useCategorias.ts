'use client';

import { useEffect, useState } from 'react';
import { client } from '@/app/_lib/hono-client';
import type { CategoriaArbol, EtiquetaDisponible } from '@/app/_types/productos';

interface DatosCatalogo {
  rubros: CategoriaArbol[];
  etiquetas: EtiquetaDisponible[];
}

const VACIO: DatosCatalogo = { rubros: [], etiquetas: [] };

// Cache a nivel de modulo. Son 30 categorias y 9 etiquetas que no cambian, asi
// que se piden una sola vez por carga de pagina y no en cada navegacion.
let cache: DatosCatalogo | null = null;
// Si dos componentes montan a la vez, comparten la misma promesa en lugar de
// disparar dos peticiones.
let enVuelo: Promise<DatosCatalogo> | null = null;

const traerDatos = async (): Promise<DatosCatalogo> => {
  if (cache) return cache;
  if (enVuelo) return enVuelo;

  enVuelo = (async () => {
    try {
      const res = await client.api.categorias.$get();
      if (!res.ok) throw new Error(`Status: ${res.status}`);

      const data = (await res.json()) as Partial<DatosCatalogo>;
      cache = {
        rubros: data.rubros ?? [],
        etiquetas: data.etiquetas ?? [],
      };
      return cache;
    } finally {
      enVuelo = null;
    }
  })();

  return enVuelo;
};

/**
 * Devuelve el arbol de rubros con sus categorias, y las etiquetas dietarias
 * con la cantidad de productos que las declaran.
 *
 * Si falla, devuelve listas vacias: los componentes que lo usan simplemente no
 * muestran los accesos por categoria ni los filtros, sin romper la pagina.
 */
export const useCategorias = () => {
  const [datos, setDatos] = useState<DatosCatalogo>(cache ?? VACIO);
  const [cargando, setCargando] = useState(!cache);

  useEffect(() => {
    let cancelado = false;

    // El cache pudo haberse llenado entre el primer render y este efecto (otro
    // componente que monto antes, o el doble montaje de React en desarrollo).
    // Hay que sincronizar el estado igual: salir sin hacerlo dejaba `cargando`
    // en true para siempre aunque los datos ya estuvieran.
    if (cache) {
      setDatos(cache);
      setCargando(false);
      return;
    }

    setCargando(true);

    traerDatos()
      .then((data) => {
        if (!cancelado) setDatos(data);
      })
      .catch((error) => {
        console.error('No se pudo cargar el catalogo de categorias:', error);
        if (!cancelado) setDatos(VACIO);
      })
      .finally(() => {
        if (!cancelado) setCargando(false);
      });

    return () => {
      cancelado = true;
    };
  }, []);

  return { rubros: datos.rubros, etiquetas: datos.etiquetas, cargando };
};
