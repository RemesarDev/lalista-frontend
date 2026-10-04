'use client';

import { useEffect, useState } from 'react';
import type { GrupoLista } from '@/app/_store/store';
import type { PromocionBancaria } from '@/app/api/[[...route]]/promociones';
import {
  calcularTotalesPorSucursal,
  type CriterioComparacion,
  type SucursalCarritoComparada,
} from './Funciones-comparacion';

// Promos que valen para cualquiera, sin importar qué tarjeta tenga
export const ENTIDADES_PARA_TODOS = ['Todos los medios de pago'];

// Misma clave que usa la sección /promociones para guardar "¿Con qué pagás?"
const CLAVE_MIS_MEDIOS = 'lalista-mis-medios-pago';

export interface PromoAplicada {
  entidad: string;
  porcentaje: number;
  tope: number | null;
  tope_periodo: PromocionBancaria['tope_periodo'];
  ahorro: number;
}

export interface SucursalConPromo extends SucursalCarritoComparada {
  totalSinPromo: number;
  promoAplicada: PromoAplicada | null;
}

export interface OpcionesPromo {
  /** Día de la compra: 1 = lunes ... 7 = domingo */
  dia: number;
  /** Medios de pago del usuario. null = cualquier medio de pago */
  misMedios: string[] | null;
}

/** Día de hoy en nuestro formato: 1 = lunes ... 7 = domingo. */
export const diaDeHoy = () => {
  const d = new Date().getDay(); // 0 = domingo
  return d === 0 ? 7 : d;
};

/** Lee los medios de pago que el usuario eligió en /promociones. */
export const leerMisMediosGuardados = (): string[] => {
  try {
    const guardado = window.localStorage.getItem(CLAVE_MIS_MEDIOS);
    return guardado ? JSON.parse(guardado) : [];
  } catch {
    return [];
  }
};

/** Trae las promos bancarias vigentes (una sola vez, cuando se activan). */
export function usePromocionesBancarias(activo: boolean) {
  const [promos, setPromos] = useState<PromocionBancaria[]>([]);
  const [cargando, setCargando] = useState(false);
  const [cargadas, setCargadas] = useState(false);

  useEffect(() => {
    if (!activo || cargadas) return;
    let cancelado = false;
    setCargando(true);

    fetch('/api/promociones-bancarias')
      .then((r) => (r.ok ? r.json() : { promociones: [] }))
      .then((data: { promociones: PromocionBancaria[] }) => {
        if (cancelado) return;
        setPromos(data.promociones ?? []);
        setCargadas(true);
      })
      .catch(() => {
        if (!cancelado) setPromos([]);
      })
      .finally(() => {
        if (!cancelado) setCargando(false);
      });

    return () => {
      cancelado = true;
    };
  }, [activo, cargadas]);

  return { promos, cargando };
}

/**
 * Busca la promo de descuento que más ahorro le da a esta sucursal.
 * Solo cuentan las que valen en sucursal física, ese día y (si el usuario
 * eligió sus medios de pago) con alguno de ellos.
 */
function mejorPromo(
  sucursal: SucursalCarritoComparada,
  promos: PromocionBancaria[],
  { dia, misMedios }: OpcionesPromo,
): PromoAplicada | null {
  let mejor: PromoAplicada | null = null;

  for (const p of promos) {
    if (p.id_comercio !== sucursal.id_comercio || p.id_bandera !== sucursal.id_bandera) continue;
    if (p.tipo_promo !== 'descuento' || !p.porcentaje) continue;
    if (p.canal === 'online') continue;
    if (!p.dias.includes(dia)) continue;
    if (misMedios && !misMedios.includes(p.entidad) && !ENTIDADES_PARA_TODOS.includes(p.entidad)) continue;

    // El tope se toma como límite para esta compra (si es semanal o mensual,
    // no sabemos si el usuario ya lo usó antes)
    const descuento = (sucursal.total * p.porcentaje) / 100;
    const ahorro = Math.round(p.tope != null ? Math.min(descuento, p.tope) : descuento);

    if (!mejor || ahorro > mejor.ahorro) {
      mejor = {
        entidad: p.entidad,
        porcentaje: p.porcentaje,
        tope: p.tope,
        tope_periodo: p.tope_periodo,
        ahorro,
      };
    }
  }
  return mejor;
}

/**
 * Igual que obtenerTopTresCadenasMasBaratas, pero aplicando antes la mejor
 * promo bancaria de cada sucursal. Así el ranking ya refleja lo que el
 * usuario pagaría de verdad.
 */
export function obtenerTopTresConPromos(
  gruposLista: GrupoLista[],
  criterio: CriterioComparacion,
  promos: PromocionBancaria[],
  opciones: OpcionesPromo,
): SucursalConPromo[] {
  const conPromo: SucursalConPromo[] = calcularTotalesPorSucursal(gruposLista, criterio).map((s) => {
    const promo = mejorPromo(s, promos, opciones);
    return {
      ...s,
      totalSinPromo: s.total,
      total: promo ? s.total - promo.ahorro : s.total,
      promoAplicada: promo,
    };
  });

  // Nos quedamos con la mejor sucursal de cada cadena (comercio + bandera)
  const mejorPorCadena = new Map<string, SucursalConPromo>();
  for (const s of conPromo) {
    const clave = `${s.id_comercio}-${s.id_bandera}`;
    const actual = mejorPorCadena.get(clave);
    if (
      !actual ||
      s.productosDisponibles > actual.productosDisponibles ||
      (s.productosDisponibles === actual.productosDisponibles &&
        (criterio === 'mas_cercana'
          ? (s.distancia ?? Infinity) < (actual.distancia ?? Infinity)
          : s.total < actual.total))
    ) {
      mejorPorCadena.set(clave, s);
    }
  }

  return [...mejorPorCadena.values()]
    .sort((a, b) => {
      const cobertura = b.productosDisponibles - a.productosDisponibles;
      if (cobertura !== 0) return cobertura;
      if (criterio === 'mas_cercana') {
        const distancia = (a.distancia ?? Infinity) - (b.distancia ?? Infinity);
        if (distancia !== 0) return distancia;
      }
      return a.total - b.total;
    })
    .slice(0, 3);
}