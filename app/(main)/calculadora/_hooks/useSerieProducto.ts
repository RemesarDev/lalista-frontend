'use client';

import { useMemo } from 'react';
import type { Changuito, PuntoMensual } from '../_types/changuito';
import type { PuntoSerie, SerieInflacion } from '../_types/inflacion';

const COLORES_SUPERMERCADO = ['var(--color-accent-600)', 'var(--color-orange-500)', 'var(--color-primary-400)'];

function puntosMensualesAPorcentaje(puntos: PuntoMensual[]): PuntoSerie[] {
  if (!puntos.length) return [];
  const base = puntos[0].precioTotal || 1;
  return puntos.map((p) => ({
    fecha: `${p.mes}-01`,
    porcentaje: Math.round(((p.precioTotal / base - 1) * 100) * 10) / 10,
  }));
}

/** Arma las líneas de UN producto puntual del changuito (no el carrito
 * completo): una serie por cada supermercado congelado, usando el
 * histórico REAL (SEPA) de ESE producto en esa cadena.
 *
 * Ojo: a diferencia de la vista de carrito completo, acá no se puede
 * combinar con el seguimiento propio mes a mes — ese seguimiento solo
 * guarda el TOTAL de la canasta por supermercado, no el desglose por
 * producto individual. Por eso esta vista muestra solamente lo que hay
 * en el histórico SEPA (puede no tener datos para todos los productos o
 * todas las cadenas). */
export function useSerieProducto(
  changuito: Changuito | null,
  productoId: string | null,
  historicoPorProductoPorClave: Record<string, Record<string, PuntoMensual[]>>,
): SerieInflacion[] {
  return useMemo(() => {
    if (!changuito || !productoId) return [];

    return changuito.supermercados
      .map((super_, i): SerieInflacion => {
        const puntos = historicoPorProductoPorClave[super_.clave]?.[productoId] ?? [];
        return {
          id: super_.clave,
          nombre: super_.cadena,
          color: COLORES_SUPERMERCADO[i % COLORES_SUPERMERCADO.length],
          estiloLinea: 'solido',
          puntos: puntosMensualesAPorcentaje(puntos),
          visible: true,
        };
      })
      .filter((serie) => serie.puntos.length > 0); // sin datos reales para este producto en esa cadena: no se muestra
  }, [changuito, productoId, historicoPorProductoPorClave]);
}