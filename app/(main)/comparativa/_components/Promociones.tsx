'use client';

import { useState } from 'react';
import Link from 'next/link';
import { BuscadorMediosPago } from '@/app/_components/global/BuscadorMediosPago';
import { FilterPill } from '@/app/_components/global/FilterPill';
import { formatearPrecio } from '@/app/_lib/utils/formatters';
import { diaDeHoy, type AlternativaPromo, type SucursalConPromo } from '../_lib/promociones';

const DIAS = [
  { numero: 1, corto: 'Lun' },
  { numero: 2, corto: 'Mar' },
  { numero: 3, corto: 'Mié' },
  { numero: 4, corto: 'Jue' },
  { numero: 5, corto: 'Vie' },
  { numero: 6, corto: 'Sáb' },
  { numero: 7, corto: 'Dom' },
];

const LETRAS_DIAS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
const NOMBRES_DIAS = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];

const PERIODO_TOPE: Record<string, string> = {
  compra: 'por compra',
  dia: 'por día',
  semana: 'por semana',
  mes: 'por mes',
};

/** [1, 3] → "lunes y miércoles" */
function textoDias(dias: number[]): string {
  const ordenados = [...dias].sort((a, b) => a - b);
  if (ordenados.length === 7) return 'todos los días';
  const nombres = ordenados.map((d) => NOMBRES_DIAS[d - 1]);
  if (nombres.length <= 1) return nombres.join('');
  return `${nombres.slice(0, -1).join(', ')} y ${nombres[nombres.length - 1]}`;
}

/** Aviso para topes que no son por compra: no sabemos si el usuario ya los usó. */
function avisoTope(periodo: string | null): string | null {
  if (periodo === 'semana') return 'Tope semanal: si ya lo usaste, el ahorro puede ser menor';
  if (periodo === 'mes') return 'Tope mensual: si ya lo usaste, el ahorro puede ser menor';
  return null;
}

interface FiltroProps {
  activo: boolean;
  onActivo: (valor: boolean) => void;
  dia: number;
  onDia: (dia: number) => void;
  soloMios: boolean;
  onSoloMios: (valor: boolean) => void;
  /** Bancos y billeteras que tienen alguna promo */
  entidadesDisponibles: string[];
  misMedios: string[];
  onMisMedios: (lista: string[]) => void;
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
  entidadesDisponibles,
  misMedios,
  onMisMedios,
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

          {entidadesDisponibles.length > 0 && (
            <div>
              <BuscadorMediosPago
                disponibles={entidadesDisponibles}
                elegidos={misMedios}
                onCambiar={onMisMedios}
              />
              {misMedios.length > 0 ? (
                <label className="-mt-2 flex items-center gap-2 text-xs text-slate-600">
                  <input
                    type="checkbox"
                    checked={soloMios}
                    onChange={(e) => onSoloMios(e.target.checked)}
                    className="h-4 w-4 accent-primary-500"
                  />
                  Solo con mis medios de pago
                </label>
              ) : (
                <p className="-mt-2 text-xs text-slate-500">
                  Sin elegir, se usa la mejor promo con cualquier tarjeta.
                </p>
              )}
            </div>
          )}
          <p className="text-xs text-slate-500">
            Se aplican descuentos válidos en sucursal. Las promos online y en cuotas se ven en Promociones.
          </p>
          <Link href="/promociones" className="inline-block text-xs font-semibold text-primary-500 hover:underline">
            Ver todas las promociones del día →
          </Link>

          {cargando && <p className="text-xs text-slate-500">Buscando promociones…</p>}
        </div>
      )}
    </section>
  );
}

/** Mini semana L M M J V S D: pinta los días en que vale y marca el día elegido. */
function MiniSemana({ dias, diaElegido }: { dias: number[]; diaElegido: number }) {
  return (
    <div className="flex gap-1" aria-label={`Vale ${textoDias(dias)}`}>
      {LETRAS_DIAS.map((letra, i) => {
        const numero = i + 1;
        const vale = dias.includes(numero);
        const elegido = numero === diaElegido;
        return (
          <span
            key={numero}
            className={[
              'flex h-5 w-5 items-center justify-center rounded text-[10px] font-bold',
              vale ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-400',
              elegido ? 'ring-2 ring-slate-800 ring-offset-1' : '',
            ].join(' ')}
          >
            {letra}
          </span>
        );
      })}
    </div>
  );
}

function FilaAlternativa({ alt, diaElegido }: { alt: AlternativaPromo; diaElegido: number }) {
  const gris = !alt.valeElDia;

  return (
    <li
      className={[
        'rounded-lg border px-2.5 py-2',
        alt.aplicada ? 'border-emerald-300 bg-white' : 'border-slate-200 bg-white',
        gris ? 'opacity-60' : '',
      ].join(' ')}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className={`font-bold ${gris ? 'text-slate-500' : 'text-slate-800'}`}>
            −{alt.porcentaje}% con {alt.entidad}
          </p>
          <p className="text-slate-500">
            {alt.tope != null
              ? `Tope $${formatearPrecio(alt.tope)} ${PERIODO_TOPE[alt.tope_periodo ?? 'compra']}`
              : 'Sin tope'}
          </p>
          {alt.tope != null && avisoTope(alt.tope_periodo) && (
            <p className="text-amber-700">{avisoTope(alt.tope_periodo)}</p>
          )}
          {alt.soloAlgunasSucursales && (
            <p className="text-amber-700">Válida solo en algunas sucursales: revisá las condiciones</p>
          )}
        </div>
        {alt.aplicada && (
          <span className="shrink-0 rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-bold text-white">
            Aplicada
          </span>
        )}
      </div>

      <div className="mt-1.5 flex items-center justify-between gap-2">
        <MiniSemana dias={alt.dias} diaElegido={diaElegido} />
        {alt.valeElDia && alt.totalConPromo != null ? (
          <p className="text-right text-slate-700">
            Pagarías <span className="font-bold">${formatearPrecio(alt.totalConPromo)}</span>
          </p>
        ) : (
          <p className="text-right text-slate-500">Válida: {textoDias(alt.dias)}</p>
        )}
      </div>
    </li>
  );
}

/** Debajo de cada supermercado: cuánto ahorrás y con qué promo, más el desplegable con todas. */
export function DetallePromo({ sucursal, dia }: { sucursal: SucursalConPromo; dia: number }) {
  const [abierto, setAbierto] = useState(false);
  const promo = sucursal.promoAplicada;
  const alternativas = sucursal.alternativas;

  return (
    <div className="-mt-2 space-y-2">
      {promo ? (
        <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs text-slate-700">
          <p>
            <span className="font-bold text-emerald-700">
              −{promo.porcentaje}% con {promo.entidad}
            </span>{' '}
            · ahorrás <span className="font-bold">${formatearPrecio(promo.ahorro)}</span>
          </p>
          <p className="text-slate-500">
            Sin promo: <span className="line-through">${formatearPrecio(sucursal.totalSinPromo)}</span>
            {promo.tope != null &&
              ` · Tope $${formatearPrecio(promo.tope)} ${PERIODO_TOPE[promo.tope_periodo ?? 'compra']}`}
          </p>
                    {promo.tope != null && avisoTope(promo.tope_periodo) && (
            <p className="mt-0.5 text-amber-700">{avisoTope(promo.tope_periodo)}</p>
          )}
          {promo.soloAlgunasSucursales && (
            <p className="mt-0.5 text-amber-700">Válida solo en algunas sucursales: revisá las condiciones</p>
          )}
        </div>
      ) : (
        <p className="px-3 text-xs text-slate-500">Sin promociones bancarias para este día.</p>
      )}

      {alternativas.length > 0 && (
        <div className="px-3">
          <button
            type="button"
            onClick={() => setAbierto((v) => !v)}
            aria-expanded={abierto}
            className="text-xs font-semibold text-primary-500 hover:underline"
          >
            {abierto ? 'Ocultar promos' : `Ver todas las promos (${alternativas.length})`}
          </button>

          {abierto && (
            <ul className="mt-2 space-y-2 text-xs">
              {alternativas.map((alt, i) => (
                <FilaAlternativa key={`${alt.entidad}-${alt.porcentaje}-${i}`} alt={alt} diaElegido={dia} />
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}