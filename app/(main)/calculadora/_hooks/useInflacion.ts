'use client';

import { useEffect, useMemo, useState } from 'react';
import { client } from '@/app/_lib/hono-client';
import { useListaStore } from '@/app/_store/store';
import { obtenerSerieIndec } from '../_lib/indec';
import { useHistoricoRealSupermercados } from './useHistoricoRealSupermercados';
import type { Changuito, PuntoMensual } from '../_types/changuito';
import type { PuntoSerie, SerieInflacion } from '../_types/inflacion';

// Colores fijos por posición — nunca se reasignan según qué serie esté oculta,
// para que la identidad de cada supermercado no cambie al tocar los toggles.
const COLORES_SUPERMERCADO = ['var(--color-accent-600)', 'var(--color-orange-500)', 'var(--color-primary-400)'];
const COLOR_INDEC = 'var(--color-sky-600)';

function puntosMensualesAPorcentaje(puntos: PuntoMensual[]): PuntoSerie[] {
  if (!puntos.length) return [];
  const base = puntos[0].precioTotal || 1;
  return puntos.map((p) => ({
    fecha: `${p.mes}-01`,
    porcentaje: Math.round(((p.precioTotal / base - 1) * 100) * 10) / 10,
  }));
}

/** Antepone el histórico REAL (SEPA, desde antes de empezar a seguir el
 * changuito) a los puntos propios (los que fuimos registrando mes a mes
 * desde que se creó el changuito). Solo se agregan los meses del
 * histórico real que sean ANTERIORES al primer punto propio — así nunca
 * se pisa ni se duplica un mes que ya tenemos de primera mano. */
function combinarConHistoricoReal(historicoReal: PuntoMensual[], puntosPropios: PuntoMensual[]): PuntoMensual[] {
  if (!historicoReal.length) return puntosPropios;
  if (!puntosPropios.length) return historicoReal;
  const primerMesPropio = puntosPropios[0].mes;
  const historicoAntesDePropios = historicoReal.filter((p) => p.mes < primerMesPropio);
  return [...historicoAntesDePropios, ...puntosPropios];
}

export function useInflacion(changuito: Changuito | null, registrarPunto: (id: string, clave: string, total: number) => void) {
  const ubicacion = useListaStore((state) => state.ubicacion);
  const sucursalesIds = useListaStore((state) => state.sucursalesIds);
  const [hidratado, setHidratado] = useState(false);

  useEffect(() => {
    if (useListaStore.persist.hasHydrated()) {
      setHidratado(true);
    } else {
      const unsub = useListaStore.persist.onFinishHydration(() => setHidratado(true));
      return unsub;
    }
  }, []);

  const [seriesVisibles, setSeriesVisibles] = useState<Record<string, boolean>>({});
  const [puntosIndec, setPuntosIndec] = useState<PuntoSerie[] | null>(null);
  const [cargandoIndec, setCargandoIndec] = useState(false);
  const [errorIndec, setErrorIndec] = useState<string | null>(null);
  const [actualizandoPrecios, setActualizandoPrecios] = useState(false);

  const { historicoPorClave: historicoReal, cargando: cargandoHistoricoReal } =
    useHistoricoRealSupermercados(changuito);

  const tieneUbicacionValida =
    hidratado &&
    ubicacion.latitud !== null &&
    ubicacion.longitud !== null &&
    !Number.isNaN(Number(ubicacion.latitud)) &&
    !Number.isNaN(Number(ubicacion.longitud));

  // 1. INDEC, anclado a la fecha de inicio de ESTE changuito.
  useEffect(() => {
    if (!changuito) return;
    let vigente = true;

    setCargandoIndec(true);
    obtenerSerieIndec(changuito.fechaInicio)
      .then((puntos) => {
        if (!vigente) return;
        setPuntosIndec(puntos);
        setErrorIndec(null);
      })
      .catch((err: unknown) => {
        if (!vigente) return;
        setErrorIndec(err instanceof Error ? err.message : 'No se pudo cargar el dato del INDEC');
      })
      .finally(() => {
        if (vigente) setCargandoIndec(false);
      });

    return () => {
      vigente = false;
    };
  }, [changuito]);

  // 2. Repreguntar el precio de hoy de los productos de ESTE changuito en
  //    CADA UNO de sus supermercados congelados, y sumar un punto mensual.
  //    (La API pide ahora `sucursales_ids` en vez de lat/lng/radio — esos
  //    ids salen del store, que los llena HeaderLocation al elegir ubicación.)
  useEffect(() => {
    if (!changuito || !tieneUbicacionValida || !sucursalesIds.length) return;
    let vigente = true;
    const ids = changuito.productos.map((p) => p.id);
    if (!ids.length) return;

    setActualizandoPrecios(true);

    client.api['precios-por-ids-area']
      .$get({
        query: {
          ids: ids.join(','),
          sucursales_ids: sucursalesIds.join(','),
        },
      })
      .then(async (res) => {
        if (!vigente || !res.ok) return;
        const data = await res.json();
        const productosFrescos = data.productos ?? [];

        for (const super_ of changuito.supermercados) {
          let total = 0;
          for (const p of changuito.productos) {
            const fresco = productosFrescos.find((pf) => pf.id === p.id);
            const sucursal = fresco?.sucursales.find(
              (s) => s.id_comercio === super_.idComercio && s.id_bandera === super_.idBandera,
            );
            if (sucursal) total += sucursal.precio * p.cantidad;
          }
          if (total > 0) registrarPunto(changuito.id, super_.clave, total);
        }
      })
      .catch(() => {
        // Sin conexión / error puntual: seguimos con el historial que ya teníamos.
      })
      .finally(() => {
        if (vigente) setActualizandoPrecios(false);
      });

    return () => {
      vigente = false;
    };
    // Solo repetimos esto cuando cambia el changuito seleccionado, la ubicación,
    // o las sucursales cercanas encontradas.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [changuito?.id, tieneUbicacionValida, sucursalesIds.join(',')]);

  const series: SerieInflacion[] = useMemo(() => {
    if (!changuito) return [];

    const lista: SerieInflacion[] = changuito.supermercados.map((super_, i) => {
      const historial = changuito.historialPorSupermercado.find((h) => h.clave === super_.clave);
      const puntosCombinados = combinarConHistoricoReal(historicoReal[super_.clave] ?? [], historial?.puntos ?? []);
      return {
        id: super_.clave,
        nombre: super_.cadena,
        color: COLORES_SUPERMERCADO[i % COLORES_SUPERMERCADO.length],
        estiloLinea: 'solido',
        puntos: puntosMensualesAPorcentaje(puntosCombinados),
        visible: seriesVisibles[super_.clave] ?? true,
      };
    });

    if (puntosIndec) {
      lista.push({
        id: 'indec',
        nombre: 'INDEC',
        color: COLOR_INDEC,
        estiloLinea: 'punteado',
        puntos: puntosIndec,
        visible: seriesVisibles.indec ?? true,
      });
    }

    return lista;
  }, [changuito, puntosIndec, seriesVisibles, historicoReal]);

  const toggleSerie = (id: string) => {
    setSeriesVisibles((actual) => ({ ...actual, [id]: !(actual[id] ?? true) }));
  };

  const tieneHistoricoReal = Object.keys(historicoReal).length > 0;

  return {
    series,
    toggleSerie,
    cargandoIndec,
    errorIndec,
    actualizandoPrecios,
    tieneUbicacionValida,
    cargandoHistoricoReal,
    tieneHistoricoReal,
  };
}