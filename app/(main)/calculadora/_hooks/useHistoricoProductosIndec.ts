'use client';

import { useEffect, useMemo, useState } from 'react';
import { obtenerHistoricoCompletoIndec } from '../_lib/indec';
import { buscarCoincidenciaIndec } from '../_lib/indecProductos';
import type { Changuito } from '../_types/changuito';
import type { SerieInflacion } from '../_types/inflacion';

// Mismos colores validados que ya usamos en el resto de la calculadora.
const COLORES = [
  'var(--color-accent-600)',
  'var(--color-orange-500)',
  'var(--color-primary-400)',
  'var(--color-sky-600)',
];

interface ProductoConCoincidencia {
  productoId: string;
  nombreProducto: string;
  nombreGenerico: string;
  serieId: string;
  aclaracion?: string;
}

/** Para cada producto del changuito, busca si el INDEC publica un genérico
 * parecido (aceite de girasol, arroz blanco simple, etc.) y trae su
 * historia completa desde 2016 — sirve de contexto aparte de las líneas
 * de supermercado, que solo empiezan desde que arrancaste a seguir. */
export function useHistoricoProductosIndec(changuito: Changuito | null) {
  const coincidencias = useMemo<ProductoConCoincidencia[]>(() => {
    if (!changuito) return [];
    return changuito.productos
      .map((p): ProductoConCoincidencia | null => {
        const match = buscarCoincidenciaIndec(p.nombre);
        if (!match) return null;
        return {
          productoId: p.id,
          nombreProducto: p.nombre,
          nombreGenerico: match.nombreGenerico,
          serieId: match.serieId,
          ...(match.aclaracion ? { aclaracion: match.aclaracion } : {}),
        };
      })
      .filter((x): x is ProductoConCoincidencia => x !== null);
  }, [changuito]);

  const [series, setSeries] = useState<SerieInflacion[]>([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!coincidencias.length) {
      setSeries([]);
      return;
    }
    let vigente = true;
    setCargando(true);
    setError(null);

    Promise.all(
      coincidencias.map((c) =>
        obtenerHistoricoCompletoIndec(c.serieId).then((puntos) => ({ ...c, puntos })),
      ),
    )
      .then((resultados) => {
        if (!vigente) return;
        setSeries(
          resultados.map((r, i) => ({
            id: r.productoId,
            nombre: r.nombreGenerico,
            color: COLORES[i % COLORES.length],
            estiloLinea: 'solido' as const,
            puntos: r.puntos,
            visible: true,
          })),
        );
      })
      .catch((err: unknown) => {
        if (!vigente) return;
        setError(err instanceof Error ? err.message : 'No se pudo cargar el histórico del INDEC');
      })
      .finally(() => {
        if (vigente) setCargando(false);
      });

    return () => {
      vigente = false;
    };
    // `coincidencias` es un array nuevo en cada render — comparamos por su
    // "firma" (los productoId que matchean) para no repetir el fetch de más.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coincidencias.map((c) => c.productoId).join(',')]);

  return {
    series,
    cargando,
    error,
    // Productos que matchearon con aclaración (para mostrar el aviso de "aproximado").
    aclaraciones: coincidencias.filter((c) => c.aclaracion),
  };
}