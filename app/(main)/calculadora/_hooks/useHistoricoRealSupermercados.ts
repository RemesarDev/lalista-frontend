'use client';

import { useEffect, useMemo, useState } from 'react';
import { useListaStore } from '@/app/_store/store';
import { obtenerCodigoProvincia } from '../_lib/provincias';
import type { Changuito, PuntoMensual } from '../_types/changuito';

interface FilaHistoricoSepa {
  periodo: string; // "YYYY-MM-DD"
  id_producto: string;
  precio_lista_mediana: number;
}

interface RespuestaHistorico {
  historico: FilaHistoricoSepa[];
}

/** Agrupa las filas (una por producto y mes) en un total por mes — pero
 * SOLO para los meses en los que están TODOS los productos del changuito.
 * Si un mes falta un producto, se descarta ese mes entero: mezclar meses
 * con distinta cantidad de productos rompería la comparación (el total
 * bajaría o subiría solo por tener menos datos, no por precio real). */
function totalesPorMes(filas: FilaHistoricoSepa[], productos: Changuito['productos']): PuntoMensual[] {
  const porMes = new Map<string, Map<string, number>>();

  for (const fila of filas) {
    const mes = fila.periodo.slice(0, 7); // "YYYY-MM-DD" -> "YYYY-MM"
    if (!porMes.has(mes)) porMes.set(mes, new Map());
    porMes.get(mes)!.set(fila.id_producto, fila.precio_lista_mediana);
  }

  const puntos: PuntoMensual[] = [];
  for (const [mes, precios] of porMes) {
    if (productos.some((p) => !precios.has(p.id))) continue; // falta algún producto este mes
    const precioTotal = productos.reduce((suma, p) => suma + (precios.get(p.id) ?? 0) * p.cantidad, 0);
    puntos.push({ mes, precioTotal });
  }

  return puntos.sort((a, b) => a.mes.localeCompare(b.mes));
}

/** Para cada supermercado congelado del changuito, trae su histórico REAL
 * de precios (tabla `sepa_precios_historico_mensual`, datos oficiales del
 * SEPA) de los productos del changuito en esa cadena — para poder mostrar
 * de entrada cómo venían esos precios desde antes, sin esperar a acumular
 * meses de seguimiento propio. Devuelve un mapa `clave de supermercado ->
 * puntos mensuales reales`; si no se pudo determinar la provincia, o la
 * cadena no tiene histórico SEPA para esos productos, esa clave
 * simplemente no aparece en el mapa (no rompe nada, la calculadora sigue
 * mostrando el seguimiento propio como siempre). */
export function useHistoricoRealSupermercados(changuito: Changuito | null) {
  const nombreLugar = useListaStore((state) => state.ubicacion.nombreLugar);
  const codigoProvincia = useMemo(() => obtenerCodigoProvincia(nombreLugar), [nombreLugar]);

  const [historicoPorClave, setHistoricoPorClave] = useState<Record<string, PuntoMensual[]>>({});
  const [cargando, setCargando] = useState(false);

  const firmaProductos = changuito?.productos.map((p) => p.id).join(',') ?? '';
  const firmaSupermercados = changuito?.supermercados.map((s) => s.clave).join(',') ?? '';

  useEffect(() => {
    if (!changuito || !codigoProvincia || !changuito.productos.length || !changuito.supermercados.length) {
      setHistoricoPorClave({});
      return;
    }
    let vigente = true;
    setCargando(true);

    const ids = changuito.productos.map((p) => p.id).join(',');

    Promise.all(
      changuito.supermercados.map(
        (super_): Promise<readonly [string, PuntoMensual[]]> =>
          fetch(
            `/api/historico-precios?ids_productos=${encodeURIComponent(ids)}&id_comercio=${super_.idComercio}&id_bandera=${super_.idBandera}&provincia=${encodeURIComponent(codigoProvincia)}`,
          )
            .then((res) => (res.ok ? (res.json() as Promise<RespuestaHistorico>) : { historico: [] }))
            .then((data) => [super_.clave, totalesPorMes(data.historico ?? [], changuito.productos)] as const)
            .catch((): readonly [string, PuntoMensual[]] => [super_.clave, []]),
      ),
    ).then((resultados) => {
      if (!vigente) return;
      const mapa: Record<string, PuntoMensual[]> = {};
      for (const [clave, puntos] of resultados) {
        if (puntos.length) mapa[clave] = puntos;
      }
      setHistoricoPorClave(mapa);
      setCargando(false);
    });

    return () => {
      vigente = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [changuito?.id, codigoProvincia, firmaProductos, firmaSupermercados]);

  return { historicoPorClave, cargando };
}