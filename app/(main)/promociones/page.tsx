'use client';

import { useEffect, useMemo, useState } from 'react';
import { FilterPill } from '@/app/_components/global/FilterPill';
import type { PromocionBancaria } from '@/app/api/[[...route]]/promociones';

const DIAS = [
  { numero: 1, corto: 'Lun', largo: 'lunes' },
  { numero: 2, corto: 'Mar', largo: 'martes' },
  { numero: 3, corto: 'Mié', largo: 'miércoles' },
  { numero: 4, corto: 'Jue', largo: 'jueves' },
  { numero: 5, corto: 'Vie', largo: 'viernes' },
  { numero: 6, corto: 'Sáb', largo: 'sábado' },
  { numero: 7, corto: 'Dom', largo: 'domingo' },
];

const PERIODO_TOPE: Record<string, string> = {
  compra: 'por compra',
  dia: 'por día',
  semana: 'por semana',
  mes: 'por mes',
};

const CANAL: Record<string, string> = {
  presencial: 'En sucursal',
  online: 'Online',
  ambos: 'Sucursal y online',
};

const TARJETA: Record<string, string> = {
  credito: 'Crédito',
  debito: 'Débito',
};

/** Día de hoy en nuestro formato: 1 = lunes ... 7 = domingo. */
const diaDeHoy = () => {
  const d = new Date().getDay(); // 0 = domingo
  return d === 0 ? 7 : d;
};

// Formatos de Carrefour (id_bandera dentro de id_comercio 10)
const FORMATOS_CARREFOUR: Record<number, string> = {
  1: 'Hiper',
  3: 'Express',
  4: 'Maxi',
};

/** Una promo puede venir repetida, una vez por cada formato de la cadena. */
interface PromoAgrupada extends PromocionBancaria {
  formatos: string[];
}

const formatearPesos = (monto: number) =>
  monto.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 });

function TarjetaPromo({ promo }: { promo: PromoAgrupada }) {
  const [verCondiciones, setVerCondiciones] = useState(false);

  const valor =
    promo.tipo_promo === 'descuento'
      ? `${promo.porcentaje}%`
      : `${promo.cuotas} cuotas`;
  const subtitulo =
    promo.tipo_promo === 'descuento'
      ? promo.cuotas
        ? `de descuento + ${promo.cuotas} cuotas sin interés`
        : 'de descuento'
      : 'sin interés';

  return (
    <li className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-slate-800">{promo.entidad}</p>
          <div className="mt-1 flex flex-wrap gap-1.5 text-xs">
            {promo.canal && (
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-600">
                {CANAL[promo.canal]}
              </span>
            )}
            {promo.formatos.length > 0 && (
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-600">
                {promo.formatos.join(' · ')}
              </span>
            )}
            {promo.tipo_tarjeta && TARJETA[promo.tipo_tarjeta] && (
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-600">
                {TARJETA[promo.tipo_tarjeta]}
              </span>
            )}
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-primary-500">{valor}</p>
          <p className="text-xs text-slate-500">{subtitulo}</p>
        </div>
      </div>

      <p className="mt-3 text-sm text-slate-600">
        {promo.tope
          ? `Tope ${formatearPesos(promo.tope)} ${PERIODO_TOPE[promo.tope_periodo ?? 'compra']}`
          : 'Sin tope informado'}
        {promo.vigencia_hasta && ` · Hasta el ${promo.vigencia_hasta.split('-').reverse().join('/')}`}
      </p>

      {promo.condiciones && (
        <div className="mt-2">
          <button
            type="button"
            onClick={() => setVerCondiciones(!verCondiciones)}
            className="text-xs font-semibold text-primary-500 hover:underline"
          >
            {verCondiciones ? 'Ocultar condiciones' : 'Ver condiciones'}
          </button>
          {verCondiciones && (
            <p className="mt-2 text-xs leading-relaxed text-slate-500">{promo.condiciones}</p>
          )}
        </div>
      )}
    </li>
  );
}

export default function PromocionesPage() {
  const [dia, setDia] = useState(diaDeHoy);
  const [promos, setPromos] = useState<PromocionBancaria[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelado = false;
    setCargando(true);
    setError(null);

    fetch(`/api/promociones-bancarias?dia=${dia}`)
      .then((r) => {
        if (!r.ok) throw new Error('No se pudieron cargar las promociones');
        return r.json();
      })
      .then((data: { promociones: PromocionBancaria[] }) => {
        if (!cancelado) setPromos(data.promociones);
      })
      .catch((e: Error) => {
        if (!cancelado) setError(e.message);
      })
      .finally(() => {
        if (!cancelado) setCargando(false);
      });

    return () => {
      cancelado = true;
    };
  }, [dia]);

  // Agrupamos por cadena: { "Coto": [...], "Jumbo": [...] }.
  // Si la misma promo viene repetida por cada formato (ej: Carrefour Hiper,
  // Express y Maxi), la mostramos una sola vez con la lista de formatos.
  const porCadena = useMemo(() => {
    const unicas = new Map<string, PromoAgrupada>();
    for (const p of promos) {
      const clave = `${p.cadena}|${p.fuente}|${p.id_origen}`;
      // Las promos solo online no son de un formato de tienda: no mostramos etiqueta
      const formato =
        p.id_comercio === 10 && p.id_bandera && p.canal !== 'online'
          ? FORMATOS_CARREFOUR[p.id_bandera]
          : undefined;
      const existente = unicas.get(clave);
      if (existente) {
        if (formato && !existente.formatos.includes(formato)) existente.formatos.push(formato);
      } else {
        unicas.set(clave, { ...p, formatos: formato ? [formato] : [] });
      }
    }

    const grupos: Record<string, PromoAgrupada[]> = {};
    for (const p of unicas.values()) {
      (grupos[p.cadena] ??= []).push(p);
    }
    return grupos;
  }, [promos]);

  const nombreDia = DIAS.find((d) => d.numero === dia)?.largo;

  return (
    <div className="mx-auto w-full max-w-3xl py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900 sm:text-3xl">Promociones</h1>
        <p className="mt-2 text-sm text-slate-600">
          Descuentos con tarjetas y billeteras en cada supermercado. Verificá siempre las
          condiciones con tu banco antes de comprar.
        </p>
      </header>

      <div className="mb-6 flex flex-wrap gap-2">
        {DIAS.map((d) => (
          <FilterPill key={d.numero} active={d.numero === dia} onClick={() => setDia(d.numero)}>
            {d.numero === diaDeHoy() ? `Hoy (${d.corto})` : d.corto}
          </FilterPill>
        ))}
      </div>

      {cargando && <p className="text-sm text-slate-500">Cargando promociones…</p>}

      {error && <p className="text-sm text-red-600">{error}</p>}

      {!cargando && !error && promos.length === 0 && (
        <p className="text-sm text-slate-500">No hay promociones cargadas para el {nombreDia}.</p>
      )}

      {!cargando && !error && (
        <div className="space-y-8">
          {Object.entries(porCadena).map(([cadena, lista]) => (
            <section key={cadena}>
              <h2 className="mb-3 text-lg font-semibold text-slate-800">
                {cadena} <span className="text-sm font-normal text-slate-500">({lista.length})</span>
              </h2>
              <ul className="space-y-3">
                {lista.map((p) => (
                  <TarjetaPromo key={p.id} promo={p} />
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}