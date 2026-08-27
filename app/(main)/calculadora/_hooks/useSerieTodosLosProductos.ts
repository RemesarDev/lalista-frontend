'use client';

import { useMemo } from 'react';
import type { Changuito, PuntoMensual } from '../_types/changuito';
import type { PuntoSerie, SerieInflacion } from '../_types/inflacion';

// Un color por producto (no por supermercado, acá cada línea ES un
// producto) — se repite cíclicamente si hay más productos que colores.
const COLORES_PRODUCTO = [
  'var(--color-accent-600)',
  'var(--color-orange-500)',
  'var(--color-primary-400)',
  'var(--color-sky-600)',
];

function puntosMensualesAPorcentaje(puntos: PuntoMensual[]): PuntoSerie[] {
  if (!puntos.length) return [];
  const base = puntos[0].precioTotal || 1;
  return puntos.map((p) => ({
    fecha: `${p.mes}-01`,
    porcentaje: Math.round(((p.precioTotal / base - 1) * 100) * 10) / 10,
  }));
}

/** Arma UNA línea por cada producto del changuito (no un total sumado ni
 * un promedio) usando su histórico SEPA real — para poder comparar de un
 * vistazo cómo le fue a cada producto por separado, sin la restricción de
 * "todo o nada por mes" que tiene el total combinado.
 *
 * Cada producto puede tener datos en más de un supermercado del
 * changuito; para no mostrar 2-3 líneas por producto (algo difícil de
 * leer con varios productos a la vez), elegimos UN supermercado por
 * producto: el que tenga MÁS meses de histórico para ese producto
 * puntual — así cada línea es lo más completa posible. Un producto sin
 * datos en NINGÚN supermercado del changuito simplemente no aparece. */
export function useSerieTodosLosProductos(
  changuito: Changuito | null,
  historicoPorProductoPorClave: Record<string, Record<string, PuntoMensual[]>>,
): SerieInflacion[] {
  return useMemo(() => {
    if (!changuito) return [];

    return changuito.productos
      .map((producto, i): SerieInflacion | null => {
        let mejoresPuntos: PuntoMensual[] = [];
        for (const super_ of changuito.supermercados) {
          const puntos = historicoPorProductoPorClave[super_.clave]?.[producto.id] ?? [];
          if (puntos.length > mejoresPuntos.length) mejoresPuntos = puntos;
        }
        if (!mejoresPuntos.length) return null;

        return {
          id: producto.id,
          nombre: producto.nombre,
          color: COLORES_PRODUCTO[i % COLORES_PRODUCTO.length],
          estiloLinea: 'solido',
          puntos: puntosMensualesAPorcentaje(mejoresPuntos),
          visible: true,
        };
      })
      .filter((s): s is SerieInflacion => s !== null);
  }, [changuito, historicoPorProductoPorClave]);
}