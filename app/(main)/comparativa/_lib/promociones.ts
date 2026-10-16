'use client';

import { useEffect, useState } from 'react';
import type { GrupoLista } from '@/app/_store/store';
import type { PromocionBancaria } from '@/app/api/[[...route]]/promociones';
import {
  calcularTotalesPorSucursal,
  type CriterioComparacion,
  type SucursalCarritoComparada,
} from './Funciones-comparacion';
import { fechaDelDiaElegido, promoVigenteEnFecha } from '@/app/_lib/utils/vigenciaPromos';

// Promos que valen para cualquiera, sin importar qué tarjeta tenga
export const ENTIDADES_PARA_TODOS = ['Todos los medios de pago'];

export interface PromoAplicada {
  entidad: string;
  porcentaje: number;
  tope: number | null;
  tope_periodo: PromocionBancaria['tope_periodo'];
  ahorro: number;
  /** true si solo vale en provincias o sucursales puntuales (para avisar) */
  soloAlgunasSucursales: boolean;
}

/**
 * true si las condiciones nombran provincias o sucursales puntuales
 * ("en las provincias de...", "excluye sucursal...", "sucursales físicas: ...").
 * Frases comunes como "Exclusivo en sucursales" no cuentan.
 */
export function valeSoloEnAlgunasSucursales(condiciones: string | null): boolean {
  if (!condiciones) return false;
  return /en las provincias de|excluye(n)? (a )?(las )?(sucursal|sucursales|tienda|tiendas)|sucursales f[ií]sicas:/i.test(
    condiciones,
  );
}

/** Una promo posible de un súper (aplicada o no), para el desplegable "Ver todas". */
export interface AlternativaPromo {
  entidad: string;
  porcentaje: number;
  tope: number | null;
  tope_periodo: PromocionBancaria['tope_periodo'];
  /** Días en que vale: 1 = lunes ... 7 = domingo */
  dias: number[];
  /** true si vale el día elegido */
  valeElDia: boolean;
  /** Cuánto ahorra. null si no vale el día elegido */
  ahorro: number | null;
  /** Total a pagar con esta promo. null si no vale el día elegido */
  totalConPromo: number | null;
  /** true si es la que se está aplicando */
  aplicada: boolean;
  /** true si solo vale en provincias o sucursales puntuales (para avisar) */
  soloAlgunasSucursales: boolean;
}

export interface SucursalConPromo extends SucursalCarritoComparada {
  totalSinPromo: number;
  promoAplicada: PromoAplicada | null;
  alternativas: AlternativaPromo[];
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
 * Arma la lista de todas las promos de descuento en sucursal de este súper
 * (si el usuario eligió sus medios de pago, solo las de esos medios) y marca
 * cuál es la que más ahorro da el día elegido.
 */
function calcularPromos(
  sucursal: SucursalCarritoComparada,
  promos: PromocionBancaria[],
  { dia, misMedios }: OpcionesPromo,
): { mejor: PromoAplicada | null; alternativas: AlternativaPromo[] } {
  const fechaElegida = fechaDelDiaElegido(dia);

  // Juntamos las promos iguales (mismo banco, porcentaje y tope) que solo cambian de día
  const agrupadas = new Map<string, { promo: PromocionBancaria; soloAlgunas: boolean }>();
  for (const p of promos) {
    if (p.id_comercio !== sucursal.id_comercio || p.id_bandera !== sucursal.id_bandera) continue;
    if (p.tipo_promo !== 'descuento' || !p.porcentaje) continue;
    if (p.canal === 'online') continue;
    if (!promoVigenteEnFecha(p, fechaElegida)) continue;
    if (misMedios && !misMedios.includes(p.entidad) && !ENTIDADES_PARA_TODOS.includes(p.entidad)) continue;

    const clave = `${p.entidad}|${p.porcentaje}|${p.tope ?? ''}|${p.tope_periodo ?? ''}`;
    const soloAlgunas = valeSoloEnAlgunasSucursales(p.condiciones);
    const existente = agrupadas.get(clave);
    if (existente) {
      existente.promo.dias = [...new Set([...existente.promo.dias, ...p.dias])];
      existente.soloAlgunas = existente.soloAlgunas || soloAlgunas;
    } else {
      agrupadas.set(clave, { promo: { ...p, dias: [...p.dias] }, soloAlgunas });
    }
  }

  const alternativas: AlternativaPromo[] = [];

  for (const { promo: p, soloAlgunas } of agrupadas.values()) {
    const valeElDia = p.dias.includes(dia);
    let ahorro: number | null = null;
    let totalConPromo: number | null = null;

    if (valeElDia) {
      // El tope se toma como límite para esta compra (si es semanal o mensual,
      // no sabemos si el usuario ya lo usó antes)
      const descuento = (sucursal.total * (p.porcentaje ?? 0)) / 100;
      ahorro = Math.round(p.tope != null ? Math.min(descuento, p.tope) : descuento);
      totalConPromo = sucursal.total - ahorro;
    }

    alternativas.push({
      entidad: p.entidad,
      porcentaje: p.porcentaje ?? 0,
      tope: p.tope,
      tope_periodo: p.tope_periodo,
      dias: p.dias,
      valeElDia,
      ahorro,
      totalConPromo,
      aplicada: false,
      soloAlgunasSucursales: soloAlgunas,
    });
  }

  // La que se aplica es la que más ahorra entre las que valen ese día
  let indiceMejor = -1;
  alternativas.forEach((a, i) => {
    if (a.ahorro == null) return;
    if (indiceMejor === -1 || a.ahorro > (alternativas[indiceMejor].ahorro ?? 0)) indiceMejor = i;
  });

  let mejor: PromoAplicada | null = null;
  if (indiceMejor !== -1) {
    const a = alternativas[indiceMejor];
    a.aplicada = true;
    mejor = {
      entidad: a.entidad,
      porcentaje: a.porcentaje,
      tope: a.tope,
      tope_periodo: a.tope_periodo,
      ahorro: a.ahorro ?? 0,
      soloAlgunasSucursales: a.soloAlgunasSucursales,
    };
  }

  // Orden: primero las que valen ese día (de más a menos ahorro), después las grises
  alternativas.sort((a, b) => {
    if (a.valeElDia !== b.valeElDia) return a.valeElDia ? -1 : 1;
    if (a.valeElDia) return (b.ahorro ?? 0) - (a.ahorro ?? 0);
    return b.porcentaje - a.porcentaje;
  });

  return { mejor, alternativas };
}

/**
 * Igual que obtenerTopTresCadenasMasBaratas, pero aplicando antes la mejor
 * promo bancaria de cada sucursal. Así el ranking ya refleja lo que el
 * usuario pagaría de verdad. Además devuelve todas las promos de cada súper.
 */
export function obtenerTopTresConPromos(
  gruposLista: GrupoLista[],
  criterio: CriterioComparacion,
  promos: PromocionBancaria[],
  opciones: OpcionesPromo,
): SucursalConPromo[] {
  const conPromo: SucursalConPromo[] = calcularTotalesPorSucursal(gruposLista, criterio).map((s) => {
    const { mejor, alternativas } = calcularPromos(s, promos, opciones);
    return {
      ...s,
      totalSinPromo: s.total,
      total: mejor ? s.total - mejor.ahorro : s.total,
      promoAplicada: mejor,
      alternativas,
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