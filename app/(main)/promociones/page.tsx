'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { FilterPill } from '@/app/_components/global/FilterPill';
import { BuscadorMediosPago } from '@/app/_components/global/BuscadorMediosPago';
import { useMisMediosPago } from '@/app/_hooks/useMisMediosPago';
import { identidadSupermercado } from '@/app/_lib/utils/identidadSupermercado';
import type { PromocionBancaria } from '@/app/api/[[...route]]/promociones';

// ---------------------------------------------------------------------------
// Textos y constantes
// ---------------------------------------------------------------------------

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

// Formatos de Carrefour (id_bandera dentro de id_comercio 10)
const FORMATOS_CARREFOUR: Record<number, string> = {
  1: 'Hiper',
  3: 'Express',
  4: 'Maxi',
};

// Promos que valen para cualquiera, sin importar qué tarjeta tenga
const ENTIDADES_PARA_TODOS = ['Todos los medios de pago'];

type Tipo = 'descuento' | 'cuotas';
type Canal = 'todos' | 'presencial' | 'online';

/** Una promo puede venir repetida, una vez por cada formato de la cadena. */
interface PromoAgrupada extends PromocionBancaria {
  formatos: string[];
}

// ---------------------------------------------------------------------------
// Utilidades
// ---------------------------------------------------------------------------

/** Día de hoy en nuestro formato: 1 = lunes ... 7 = domingo. */
const diaDeHoy = () => {
  const d = new Date().getDay(); // 0 = domingo
  return d === 0 ? 7 : d;
};

const formatearPesos = (monto: number) =>
  monto.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 });

const formatearFecha = (iso: string) => iso.split('-').reverse().join('/');

/** Junta las promos repetidas por formato (ej: Carrefour Hiper, Express y Maxi). */
function agrupar(promos: PromocionBancaria[]): PromoAgrupada[] {
  const unicas = new Map<string, PromoAgrupada>();
  for (const p of promos) {
    const clave = `${p.cadena}|${p.fuente}|${p.id_origen}`;
    // Las promos solo online no son de un formato de tienda: sin etiqueta
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
  return [...unicas.values()];
}

const valorDe = (p: PromoAgrupada) => (p.tipo_promo === 'descuento' ? p.porcentaje ?? 0 : p.cuotas ?? 0);

// ---------------------------------------------------------------------------
// Componentes
// ---------------------------------------------------------------------------

/** Evita que un botón se achique o parta su texto dentro de una fila deslizable. */
function NoEncoger({ children }: { children: ReactNode }) {
  return <span className="shrink-0 whitespace-nowrap">{children}</span>;
}

// Fila que se desliza de costado sin mostrar la barra de scroll
const FILA_DESLIZABLE =
  '-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden';

function FilaPromo({ promo }: { promo: PromoAgrupada }) {
  const [abierta, setAbierta] = useState(false);

  const etiquetas = [
    promo.canal ? CANAL[promo.canal] : null,
    promo.formatos.length ? promo.formatos.join(' · ') : null,
    promo.tipo_tarjeta ? TARJETA[promo.tipo_tarjeta] : null,
  ].filter(Boolean) as string[];

  const detalle = [
    promo.tope
      ? `Tope ${formatearPesos(promo.tope)} ${PERIODO_TOPE[promo.tope_periodo ?? 'compra']}`
      : 'Sin tope informado',
    promo.vigencia_hasta ? `Hasta el ${formatearFecha(promo.vigencia_hasta)}` : null,
  ].filter(Boolean).join(' · ');

  return (
    <li className="border-b border-slate-100 last:border-b-0">
      <button
        type="button"
        onClick={() => setAbierta(!abierta)}
        aria-expanded={abierta}
        className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-slate-50"
      >
        <div className="w-16 shrink-0 text-right">
          <span className="text-xl font-bold text-primary-500">
            {promo.tipo_promo === 'descuento' ? `${promo.porcentaje}%` : promo.cuotas}
          </span>
          {promo.tipo_promo === 'cuotas' && (
            <span className="block text-[10px] leading-tight text-slate-500">cuotas s/int.</span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-slate-800">
            {promo.entidad}
            {promo.tipo_promo === 'descuento' && promo.cuotas ? (
              <span className="font-normal text-slate-500"> + {promo.cuotas} cuotas</span>
            ) : null}
          </p>
          <p className="truncate text-xs text-slate-500">{detalle}</p>
          {etiquetas.length > 0 && (
            <div className="mt-1 flex flex-wrap gap-1">
              {etiquetas.map((e) => (
                <span key={e} className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600">
                  {e}
                </span>
              ))}
            </div>
          )}
        </div>

        <span
          aria-hidden="true"
          className={`shrink-0 text-slate-400 transition-transform ${abierta ? 'rotate-180' : ''}`}
        >
          ▾
        </span>
      </button>

      {abierta && promo.condiciones && (
        <p className="px-4 pb-4 text-xs leading-relaxed text-slate-500">{promo.condiciones}</p>
      )}
    </li>
  );
}

function InsigniaSuper({ cadena, tamano = 'md' }: { cadena: string; tamano?: 'md' | 'lg' }) {
  const { color, iniciales, colorTexto } = identidadSupermercado(cadena);
  const medidas = tamano === 'lg' ? 'h-12 w-12 text-sm' : 'h-10 w-10 text-xs';
  return (
    <span
      aria-hidden="true"
      className={`flex shrink-0 items-center justify-center rounded-full font-bold ${medidas}`}
      style={{ backgroundColor: color, color: colorTexto }}
    >
      {iniciales}
    </span>
  );
}

interface ResumenSuper {
  cadena: string;
  promos: PromoAgrupada[]; // toda la semana
  delDia: PromoAgrupada[]; // solo el día elegido, de mejor a peor
  diasConPromo: Set<number>;
}

function TarjetaSuper({
  resumen,
  dia,
  tipo,
  onAbrir,
}: {
  resumen: ResumenSuper;
  dia: number;
  tipo: Tipo;
  onAbrir: () => void;
}) {
  const mejor = resumen.delDia[0];
  const nombreDia = DIAS.find((d) => d.numero === dia)?.largo;

  return (
    <button
      type="button"
      onClick={onAbrir}
      className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-4 text-left transition hover:border-primary-400 hover:shadow-md"
    >
      <div className="flex items-center gap-3">
        <InsigniaSuper cadena={resumen.cadena} />
        <p className="truncate font-semibold text-slate-800">{resumen.cadena}</p>
      </div>

      <div className="mt-3 flex-1">
        {mejor ? (
          <>
            <p className="text-xs text-slate-500">Hasta</p>
            <p className="text-3xl font-bold leading-tight text-primary-500">
              {tipo === 'descuento' ? `${mejor.porcentaje}%` : `${mejor.cuotas} cuotas`}
            </p>
            <p className="truncate text-xs text-slate-600">
              con {mejor.entidad}
              {resumen.delDia.length > 1 && ` y ${resumen.delDia.length - 1} más`}
            </p>
          </>
        ) : (
          <p className="text-sm text-slate-500">Sin promos el {nombreDia}</p>
        )}
      </div>

      {/* Mini semana: qué días tiene promos */}
      <div className="mt-3 flex justify-between gap-1" aria-label="Días con promociones">
        {DIAS.map((d) => {
          const tiene = resumen.diasConPromo.has(d.numero);
          const elegido = d.numero === dia;
          return (
            <span
              key={d.numero}
              title={`${d.largo}${tiene ? ': con promos' : ': sin promos'}`}
              className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold ${
                tiene ? 'bg-primary-500 text-white' : 'bg-slate-100 text-slate-400'
              } ${elegido ? 'ring-2 ring-slate-800 ring-offset-1' : ''}`}
            >
              {d.corto[0]}
            </span>
          );
        })}
      </div>
    </button>
  );
}

function PanelSuper({
  resumen,
  dia,
  onCerrar,
}: {
  resumen: ResumenSuper;
  dia: number;
  onCerrar: () => void;
}) {
  // Cerrar con la tecla Esc
  useEffect(() => {
    const alApretar = (e: globalThis.KeyboardEvent) => e.key === 'Escape' && onCerrar();
    window.addEventListener('keydown', alApretar);
    return () => window.removeEventListener('keydown', alApretar);
  }, [onCerrar]);

  // La semana empezando por el día elegido
  const semana = [...DIAS.slice(dia - 1), ...DIAS.slice(0, dia - 1)];

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="dialog" aria-modal="true" aria-label={`Promociones de ${resumen.cadena}`}>
      <button type="button" aria-label="Cerrar" onClick={onCerrar} className="absolute inset-0 bg-slate-900/40" />

      <div className="relative flex max-h-[85vh] w-full max-w-lg flex-col rounded-t-3xl bg-slate-50 sm:rounded-3xl">
        <header className="flex items-center gap-3 border-b border-slate-200 p-4">
          <InsigniaSuper cadena={resumen.cadena} tamano="lg" />
          <div className="flex-1">
            <p className="text-lg font-semibold text-slate-900">{resumen.cadena}</p>
            <p className="text-xs text-slate-500">Promociones de la semana</p>
          </div>
          <button
            type="button"
            onClick={onCerrar}
            aria-label="Cerrar"
            className="flex h-9 w-9 items-center justify-center rounded-full text-xl text-slate-500 hover:bg-slate-200"
          >
            ×
          </button>
        </header>

        <div className="space-y-5 overflow-y-auto p-4">
          {semana.map((d) => {
            const delDia = resumen.promos
              .filter((p) => p.dias.includes(d.numero))
              .sort((a, b) => valorDe(b) - valorDe(a));
            const esElegido = d.numero === dia;
            return (
              <section key={d.numero}>
                <h3 className={`mb-2 text-sm font-semibold capitalize ${esElegido ? 'text-primary-500' : 'text-slate-700'}`}>
                  {d.numero === diaDeHoy() ? `Hoy (${d.largo})` : d.largo}
                </h3>
                {delDia.length > 0 ? (
                  <ul className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                    {delDia.map((p) => (
                      <FilaPromo key={`${d.numero}-${p.fuente}-${p.id_origen}`} promo={p} />
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-slate-400">Sin promociones.</p>
                )}
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Página
// ---------------------------------------------------------------------------

export default function PromocionesPage() {
  const [dia, setDia] = useState(diaDeHoy);
  const [tipo, setTipo] = useState<Tipo>('descuento');
  const [canal, setCanal] = useState<Canal>('todos');
  const [superAbierto, setSuperAbierto] = useState<string | null>(null);

  const { misMedios, cambiarMisMedios: guardarMisMedios } = useMisMediosPago();
  const [soloMios, setSoloMios] = useState(true);

  const cambiarMisMedios = (lista: string[]) => {
    guardarMisMedios(lista);
    setSoloMios(lista.length > 0);
  };

  const [promos, setPromos] = useState<PromocionBancaria[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Traemos todas las promos una sola vez: cambiar de día es instantáneo
  useEffect(() => {
    let cancelado = false;
    fetch('/api/promociones-bancarias')
      .then((r) => {
        if (!r.ok) throw new Error('No pudimos cargar las promociones. Probá de nuevo en un rato.');
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
  }, []);

  const agrupadas = useMemo(() => agrupar(promos), [promos]);

  // Todos los bancos y billeteras con alguna promo (para el buscador)
  const todasLasEntidades = useMemo(
    () =>
      [...new Set(agrupadas.map((p) => p.entidad))]
        .filter((e) => !ENTIDADES_PARA_TODOS.includes(e))
        .sort((a, b) => a.localeCompare(b, 'es')),
    [agrupadas],
  );

  const filtrarPorMios = soloMios && misMedios.length > 0;

  // Promos de la semana que pasan los filtros (tipo, canal, medios de pago)
  const filtradas = useMemo(
    () =>
      agrupadas.filter(
        (p) =>
          p.tipo_promo === tipo &&
          (canal === 'todos' || p.canal === canal || p.canal === 'ambos') &&
          (!filtrarPorMios || misMedios.includes(p.entidad) || ENTIDADES_PARA_TODOS.includes(p.entidad)),
      ),
    [agrupadas, tipo, canal, filtrarPorMios, misMedios],
  );

  // Un resumen por supermercado, ordenados por la mejor promo del día elegido
  const supers: ResumenSuper[] = useMemo(() => {
    const porCadena = new Map<string, PromoAgrupada[]>();
    for (const p of filtradas) porCadena.set(p.cadena, [...(porCadena.get(p.cadena) ?? []), p]);

    return [...porCadena.entries()]
      .map(([cadena, lista]) => ({
        cadena,
        promos: lista,
        delDia: lista.filter((p) => p.dias.includes(dia)).sort((a, b) => valorDe(b) - valorDe(a)),
        diasConPromo: new Set(lista.flatMap((p) => p.dias)),
      }))
      .sort((a, b) => (b.delDia[0] ? valorDe(b.delDia[0]) : -1) - (a.delDia[0] ? valorDe(a.delDia[0]) : -1));
  }, [filtradas, dia]);

  const abierto = supers.find((s) => s.cadena === superAbierto) ?? null;
  const hayFiltros = canal !== 'todos' || filtrarPorMios;

  return (
    <div className="mx-auto w-full max-w-5xl py-8">
      <header className="mb-5">
        <h1 className="text-2xl font-semibold text-slate-900 sm:text-3xl">Promociones</h1>
        <p className="mt-1 text-sm text-slate-600">
          Descuentos con tarjetas y billeteras en cada supermercado. Verificá las condiciones antes de
          comprar.
        </p>
      </header>

      {/* Día */}
      <div className={`${FILA_DESLIZABLE} mb-4`}>
        {DIAS.map((d) => (
          <NoEncoger key={d.numero}>
            <FilterPill active={d.numero === dia} onClick={() => setDia(d.numero)}>
              {d.numero === diaDeHoy() ? `Hoy (${d.corto})` : d.corto}
            </FilterPill>
          </NoEncoger>
        ))}
      </div>

      {/* Descuentos / Cuotas  +  canal */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="inline-flex rounded-xl bg-slate-100 p-1" role="tablist">
          {(['descuento', 'cuotas'] as Tipo[]).map((t) => (
            <button
              key={t}
              type="button"
              role="tab"
              aria-selected={tipo === t}
              onClick={() => setTipo(t)}
              className={`rounded-lg px-4 py-1.5 text-sm font-semibold transition ${
                tipo === t ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {t === 'descuento' ? 'Descuentos' : 'Cuotas sin interés'}
            </button>
          ))}
        </div>
        <div className={FILA_DESLIZABLE}>
          {(['todos', 'presencial', 'online'] as Canal[]).map((c) => (
            <NoEncoger key={c}>
              <FilterPill active={canal === c} onClick={() => setCanal(c)}>
                {c === 'todos' ? 'Sucursal y online' : CANAL[c]}
              </FilterPill>
            </NoEncoger>
          ))}
        </div>
      </div>

      {/* ¿Con qué pagás? */}
      {!cargando && !error && todasLasEntidades.length > 0 && (
        <div className="mb-6 max-w-xl">
          <BuscadorMediosPago disponibles={todasLasEntidades} elegidos={misMedios} onCambiar={cambiarMisMedios} />
          {misMedios.length > 0 && (
            <label className="-mt-2 flex items-center gap-2 text-xs text-slate-600">
              <input
                type="checkbox"
                checked={soloMios}
                onChange={(e) => setSoloMios(e.target.checked)}
                className="h-4 w-4 accent-primary-500"
              />
              Ver solo las promos que puedo usar
            </label>
          )}
        </div>
      )}

      {/* Estados */}
      {cargando && (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3" aria-busy="true">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-44 animate-pulse rounded-2xl bg-slate-100" />
          ))}
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      {!cargando && !error && supers.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center">
          <p className="text-sm text-slate-600">
            No hay {tipo === 'descuento' ? 'descuentos' : 'promos en cuotas'}
            {hayFiltros ? ' con estos filtros' : ''}.
          </p>
          {hayFiltros && (
            <button
              type="button"
              onClick={() => {
                setCanal('todos');
                setSoloMios(false);
              }}
              className="mt-2 text-sm font-semibold text-primary-500 hover:underline"
            >
              Quitar filtros
            </button>
          )}
        </div>
      )}

      {/* Grilla de supermercados */}
      {!cargando && !error && supers.length > 0 && (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
          {supers.map((s) => (
            <TarjetaSuper key={s.cadena} resumen={s} dia={dia} tipo={tipo} onAbrir={() => setSuperAbierto(s.cadena)} />
          ))}
        </div>
      )}

      {abierto && <PanelSuper resumen={abierto} dia={dia} onCerrar={() => setSuperAbierto(null)} />}
    </div>
  );
}