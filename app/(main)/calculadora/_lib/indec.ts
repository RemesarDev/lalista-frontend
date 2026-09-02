import type { PuntoSerie } from '../_types/inflacion';

/**
 * API de Series de Tiempo de Argentina.gob.ar (datos abiertos, sin API key).
 * Serie usada: IPC Nivel General Nacional (INDEC), base diciembre 2016 = 100.
 * Documentación: https://www.argentina.gob.ar/datos-abiertos/api-series-de-tiempo
 */
const SERIE_INDEC_IPC = '148.3_INIVELNAL_DICI_M_26';
const INDEC_API_URL = 'https://apis.datos.gob.ar/series/api/series/';

interface RespuestaSeriesIndec {
  data: [string, number][];
}

/**
 * El INDEC publica el IPC con semanas de atraso: el mes en curso (o incluso
 * el anterior, según el día) todavía puede no estar publicado. Por eso no
 * pedimos el dato exacto desde el día de inicio del changuito, sino desde
 * un mes antes — así siempre hay un punto ya publicado para usar de base.
 */
function primerDiaMesAnterior(fechaISO: string): string {
  const [anio, mes] = fechaISO.split('-').map(Number);
  const fecha = new Date(Date.UTC(anio, mes - 1 - 1, 1));
  return `${fecha.getUTCFullYear()}-${String(fecha.getUTCMonth() + 1).padStart(2, '0')}-01`;
}

/** Pedido genérico a la API de series del INDEC: trae `seriesId` desde
 * `startDateISO` (o toda la historia disponible si no se pasa fecha) y la
 * convierte a "% acumulado" tomando como base (0%) el primer valor
 * devuelto, para poder compararla en el mismo eje que el resto. */
async function traerSerieIndec(seriesId: string, startDateISO?: string): Promise<PuntoSerie[]> {
  const params = new URLSearchParams({ ids: seriesId, limit: '1000', format: 'json' });
  if (startDateISO) params.set('start_date', startDateISO);

  const res = await fetch(`${INDEC_API_URL}?${params.toString()}`);

  if (!res.ok) {
    throw new Error('No se pudo conectar con la API del INDEC');
  }

  const json: RespuestaSeriesIndec = await res.json();
  const filas = json.data ?? [];

  if (!filas.length) {
    throw new Error('El INDEC no devolvió datos para el período solicitado');
  }

  const valorBase = filas[0][1];

  return filas.map(([fecha, valor]) => ({
    fecha,
    porcentaje: Math.round(((valor / valorBase - 1) * 100) * 10) / 10,
  }));
}

/**
 * Trae la serie de IPC Nivel General del INDEC desde un poco antes de
 * `fechaInicioISO` en adelante (ver `primerDiaMesAnterior`).
 */
export async function obtenerSerieIndec(fechaInicioISO: string): Promise<PuntoSerie[]> {
  return traerSerieIndec(SERIE_INDEC_IPC, primerDiaMesAnterior(fechaInicioISO));
}

/** Trae la historia COMPLETA (desde que el INDEC tiene datos, ~2016) de
 * una serie puntual — se usa para comparar productos genéricos del INDEC
 * (aceite de girasol, arroz, etc.) contra los productos de tu changuito. */
export async function obtenerHistoricoCompletoIndec(seriesId: string): Promise<PuntoSerie[]> {
  return traerSerieIndec(seriesId);
}