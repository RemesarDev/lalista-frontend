'use client';

import Link from 'next/link';
import { FilterPill } from '@/app/_components/global/FilterPill';
import { formatearPrecio } from '@/app/_lib/utils/formatters';
import { diaDeHoy, type SucursalConPromo } from '../_lib/promociones';

const DIAS = [
  { numero: 1, corto: 'Lun' },
  { numero: 2, corto: 'Mar' },
  { numero: 3, corto: 'Mié' },
  { numero: 4, corto: 'Jue' },
  { numero: 5, corto: 'Vie' },
  { numero: 6, corto: 'Sáb' },
  { numero: 7, corto: 'Dom' },
];

const PERIODO_TOPE: Record<string, string> = {
  compra: 'por compra',
  dia: 'por día',
  semana: 'por semana',
  mes: 'por mes',
};

interface FiltroProps {
  activo: boolean;
  onActivo: (valor: boolean) => void;
  dia: number;
  onDia: (dia: number) => void;
  soloMios: boolean;
  onSoloMios: (valor: boolean) => void;
  cantidadMisMedios: number;
  cargando: boolean;
}

/** Interruptor "Aplicar promociones" + día de compra + "solo mis medios de pago". */
export function FiltroPromociones({
  activo,
  onActivo,
  dia,
  onDia,
  soloMios,
  onSoloMios,
  cantidadMisMedios,
  cargando,
}: FiltroProps) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm" aria-label="Promociones bancarias">
      <label className="flex cursor-pointer items-center justify-between gap-3">
        <span>
          <span className="block text-sm font-bold text-slate-800">Aplicar promociones bancarias</span>
          <span className="block text-xs text-slate-500">
            Recalcula los totales con el mejor descuento de cada supermercado.
          </span>
        </span>
        <input
          type="checkbox"
          role="switch"
          checked={activo}
          onChange={(e) => onActivo(e.target.checked)}
          className="h-5 w-5 shrink-0 accent-primary-500"
        />
      </label>

      {activo && (
        <div className="mt-3 space-y-3 border-t border-slate-100 pt-3">
          <div>
            <p className="mb-1.5 text-xs font-semibold text-slate-600">¿Qué día vas a comprar?</p>
            <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {DIAS.map((d) => (
                <span key={d.numero} className="shrink-0 whitespace-nowrap">
                  <FilterPill active={d.numero === dia} onClick={() => onDia(d.numero)}>
                    {d.numero === diaDeHoy() ? `Hoy (${d.corto})` : d.corto}
                  </FilterPill>
                </span>
              ))}
            </div>
          </div>

          {cantidadMisMedios > 0 ? (
            <label className="flex items-center gap-2 text-xs text-slate-600">
              <input
                type="checkbox"
                checked={soloMios}
                onChange={(e) => onSoloMios(e.target.checked)}
                className="h-4 w-4 accent-primary-500"
              />
              Solo con mis medios de pago ({cantidadMisMedios})
            </label>
          ) : (
            <p className="text-xs text-slate-500">
              Se usa la mejor promo con cualquier tarjeta.{' '}
              <Link href="/promociones" className="font-semibold text-primary-500 hover:underline">
                Elegí tus medios de pago
              </Link>{' '}
              para ver solo las que podés usar.
            </p>
          )}

          {cargando && <p className="text-xs text-slate-500">Buscando promociones…</p>}
        </div>
      )}
    </section>
  );
}

/** Debajo de cada supermercado: cuánto ahorrás y con qué promo. */
export function DetallePromo({ sucursal }: { sucursal: SucursalConPromo }) {
  const promo = sucursal.promoAplicada;

  if (!promo) {
    return (
      <p className="-mt-2 px-3 text-xs text-slate-500">Sin promociones bancarias para este día.</p>
    );
  }

  return (
    <div className="-mt-2 rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs text-slate-700">
      <p>
        <span className="font-bold text-emerald-700">
          −{promo.porcentaje}% con {promo.entidad}
        </span>{' '}
        · ahorrás <span className="font-bold">${formatearPrecio(promo.ahorro)}</span>
      </p>
      <p className="text-slate-500">
        Sin promo: <span className="line-through">${formatearPrecio(sucursal.totalSinPromo)}</span>
        {promo.tope != null && ` · Tope $${formatearPrecio(promo.tope)} ${PERIODO_TOPE[promo.tope_periodo ?? 'compra']}`}
      </p>
    </div>
  );
}