'use client';

import { useEffect, useMemo, useState } from 'react';
import { useListaStore } from '@/app/_store/store';
import { obtenerCodigoProvincia } from '../_lib/provincias';
import type { Changuito, PuntoMensual } from '../_types/changuito';
import type { PuntoSerie, SerieInflacion } from '../_types/inflacion';

interface FilaHistoricoSepa {
  periodo: string; // "YYYY-MM-DD"
  id_producto: string;
  precio_lista_mediana: number;
}

interface RespuestaHistorico {
  historico: FilaHistoricoSepa[];
}

const COLORES_PRODUCTO = [
  'var(--color-accent-600)',
  'var(--color-orange-500)',
  'var(--color-primary-400)',
  'var(--color-sky-600)',
];
const COLOR_TOTAL = 'var(--color-accent-600)';

function puntosMensualesAPorcentaje(puntos: PuntoMensual[]): PuntoSerie[] {
  if (!puntos.length) return [];
  const base = puntos[0].precioTotal || 1;
  return puntos.map((p) => ({
    fecha: `${p.mes}-01`,
    porcentaje: Math.round(((p.precioTotal / base - 1) * 100) * 10) / 10,
  }));
}

/**
 * Histórico SEPA de los productos del changuito, promediado entre TODOS
 * los supermercados de tu provincia. Esto le da muchísima más cobertura de meses: alcanza con
 * que CUALQUIER supermercado de la provincia haya reportado el producto
 * ese mes, no uno puntual.
 *
 * Devuelve:
 * - `porProducto`: una línea por producto (precio promedio mensual de ESE
 *   producto en la provincia) — para la vista "Todos los productos" y la
 *   de un producto puntual.
 * - `total`: una única línea con el total de la canasta — SOLO se calculan
 *   los meses en los que TODOS los productos tienen promedio disponible
 *   (si falta uno, se descarta ese mes, para no distorsionar la
 *   comparación) — para la vista "Changuito completo".
 */
export function useHistoricoProvincia(changuito: Changuito | null): {
  porProducto: SerieInflacion[];
  total: SerieInflacion | null;
  cargando: boolean;
} {
  const nombreLugar = useListaStore((state) => state.ubicacion.nombreLugar);
  const codigoProvincia = useMemo(() => obtenerCodigoProvincia(nombreLugar), [nombreLugar]);

  const [porProducto, setPorProducto] = useState<SerieInflacion[]>([]);
  const [total, setTotal] = useState<SerieInflacion | null>(null);
  const [cargando, setCargando] = useState(false);

  const firmaProductos = changuito?.productos.map((p) => p.id).join(',') ?? '';

  useEffect(() => {
    if (!changuito || !codigoProvincia || !changuito.productos.length) {
      setPorProducto([]);
      setTotal(null);
      return;
    }
    let vigente = true;
    setCargando(true);

    fetch(
      `/api/historico-precios?ids_productos=${encodeURIComponent(firmaProductos)}&provincia=${encodeURIComponent(codigoProvincia)}`,
    )
      .then((res) => (res.ok ? (res.json() as Promise<RespuestaHistorico>) : { historico: [] }))
      .then((data) => {
        if (!vigente) return;
        const filas = data.historico ?? [];

        // idProducto -> mes -> { suma, cantidad } (para promediar)
        const acumulado = new Map<string, Map<string, { suma: number; cantidad: number }>>();
        for (const fila of filas) {
          const mes = fila.periodo.slice(0, 7);
          if (!acumulado.has(fila.id_producto)) acumulado.set(fila.id_producto, new Map());
          const porMes = acumulado.get(fila.id_producto)!;
          const actual = porMes.get(mes) ?? { suma: 0, cantidad: 0 };
          actual.suma += fila.precio_lista_mediana;
          actual.cantidad += 1;
          porMes.set(mes, actual);
        }

        // Promedio mensual por producto: precioProvincia = suma / cantidad de reportes.
        const promedioPorProductoYMes = new Map<string, Map<string, number>>();
        for (const [idProducto, porMes] of acumulado) {
          const promedios = new Map<string, number>();
          for (const [mes, { suma, cantidad }] of porMes) promedios.set(mes, suma / cantidad);
          promedioPorProductoYMes.set(idProducto, promedios);
        }

        const nuevasSeries: SerieInflacion[] = changuito.productos
          .map((producto, i): SerieInflacion | null => {
            const promedios = promedioPorProductoYMes.get(producto.id);
            if (!promedios || !promedios.size) return null;
            const puntos = Array.from(promedios.entries())
              .map(([mes, precioTotal]) => ({ mes, precioTotal }))
              .sort((a, b) => a.mes.localeCompare(b.mes));
            return {
              id: producto.id,
              nombre: producto.nombre,
              color: COLORES_PRODUCTO[i % COLORES_PRODUCTO.length],
              estiloLinea: 'solido',
              puntos: puntosMensualesAPorcentaje(puntos),
              visible: true,
            };
          })
          .filter((s): s is SerieInflacion => s !== null);

        // Total combinado: solo meses donde TODOS los productos tienen promedio.
        const mesesComunes = new Set<string>();
        let primero = true;
        for (const producto of changuito.productos) {
          const promedios = promedioPorProductoYMes.get(producto.id);
          const mesesProducto = new Set(promedios ? promedios.keys() : []);
          if (primero) {
            for (const mes of mesesProducto) mesesComunes.add(mes);
            primero = false;
          } else {
            for (const mes of Array.from(mesesComunes)) {
              if (!mesesProducto.has(mes)) mesesComunes.delete(mes);
            }
          }
        }

        let nuevoTotal: SerieInflacion | null = null;
        if (mesesComunes.size && changuito.productos.length) {
          const puntosTotal: PuntoMensual[] = Array.from(mesesComunes)
            .sort()
            .map((mes) => {
              const precioTotal = changuito.productos.reduce((suma, p) => {
                const promedio = promedioPorProductoYMes.get(p.id)?.get(mes) ?? 0;
                return suma + promedio * p.cantidad;
              }, 0);
              return { mes, precioTotal };
            });
          nuevoTotal = {
            id: 'total',
            nombre: 'Tu changuito',
            color: COLOR_TOTAL,
            estiloLinea: 'solido',
            puntos: puntosMensualesAPorcentaje(puntosTotal),
            visible: true,
          };
        }

        setPorProducto(nuevasSeries);
        setTotal(nuevoTotal);
        setCargando(false);
      })
      .catch(() => {
        if (!vigente) return;
        setPorProducto([]);
        setTotal(null);
        setCargando(false);
      });

    return () => {
      vigente = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [changuito?.id, codigoProvincia, firmaProductos]);

  return { porProducto, total, cargando };
}