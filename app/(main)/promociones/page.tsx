'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { FilterPill } from '@/app/_components/global/FilterPill';
import { BuscadorMediosPago } from '@/app/_components/global/BuscadorMediosPago';
import { useMisMediosPago } from '@/app/_hooks/useMisMediosPago';
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

// Cuántos bancos mostramos como filtro rápido (los más frecuentes del día)
const MAX_FILTROS_ENTIDAD = 8;

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

const idSeccion = (cadena: string) =>
  `cadena-${cadena
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')}`;

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

// ---------------------------------------------------------------------------
// Página
// ---------------------------------------------------------------------------

export default function PromocionesPage() {
  const [dia, setDia] = useState(diaDeHoy);
  const [tipo, setTipo] = useState<Tipo>('descuento');
  const [canal, setCanal] = useState<Canal>('todos');
  const [entidad, setEntidad] = useState<string | null>(null);

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
  // y podemos armar la lista completa de bancos para "¿Con qué pagás?"
  useEffect(() => {
    let cancelado = false;
    setCargando(true);
    setError(null);

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

  // Todos los bancos y billeteras que tienen alguna promo en la semana
  const todasLasEntidades = useMemo(
    () =>
      [...new Set(agrupadas.map((p) => p.entidad))]
        .filter((e) => !ENTIDADES_PARA_TODOS.includes(e))
        .sort((a, b) => a.localeCompare(b, 'es')),
    [agrupadas],
  );

  const filtrarPorMios = soloMios && misMedios.length > 0;

  // Promos del tipo y canal elegidos (antes de filtrar por banco)
  const delTipo = useMemo(
    () =>
      agrupadas.filter(
        (p) =>
          p.dias.includes(dia) &&
          p.tipo_promo === tipo &&
          (canal === 'todos' || p.canal === canal || p.canal === 'ambos') &&
          (!filtrarPorMios || misMedios.includes(p.entidad) || ENTIDADES_PARA_TODOS.includes(p.entidad)),
      ),
    [agrupadas, dia, tipo, canal, filtrarPorMios, misMedios],
  );

  // Bancos más frecuentes del día, para los filtros rápidos
  const entidadesFrecuentes = useMemo(() => {
    const cuenta = new Map<string, number>();
    for (const p of delTipo) cuenta.set(p.entidad, (cuenta.get(p.entidad) ?? 0) + 1);
    return [...cuenta.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, MAX_FILTROS_ENTIDAD)
      .map(([nombre]) => nombre);
  }, [delTipo]);

  // Si el banco elegido no tiene promos con los filtros nuevos, lo soltamos
  useEffect(() => {
    if (entidad && !delTipo.some((p) => p.entidad === entidad)) setEntidad(null);
  }, [delTipo, entidad]);

  const visibles = useMemo(
    () => delTipo.filter((p) => !entidad || p.entidad === entidad),
    [delTipo, entidad],
  );

  // Agrupadas por cadena, de mayor a menor beneficio
  const porCadena = useMemo(() => {
    const grupos: Record<string, PromoAgrupada[]> = {};
    for (const p of visibles) (grupos[p.cadena] ??= []).push(p);
    for (const lista of Object.values(grupos)) lista.sort((a, b) => valorDe(b) - valorDe(a));
    // Las cadenas con la mejor promo van primero
    return Object.entries(grupos).sort((a, b) => valorDe(b[1][0]) - valorDe(a[1][0]));
  }, [visibles]);

  const nombreDia = DIAS.find((d) => d.numero === dia)?.largo;
  const esHoy = dia === diaDeHoy();
  const hayFiltros = canal !== 'todos' || entidad !== null || filtrarPorMios;

  const irACadena = (cadena: string) =>
    document.getElementById(idSeccion(cadena))?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  return (
    <div className="mx-auto w-full max-w-3xl py-8">
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

      {/* Descuentos / Cuotas */}
      <div className="mb-4 inline-flex rounded-xl bg-slate-100 p-1" role="tablist">
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

      {/* Mis medios de pago */}
      {!cargando && !error && todasLasEntidades.length > 0 && (
        <>
          <BuscadorMediosPago
            disponibles={todasLasEntidades}
            elegidos={misMedios}
            onCambiar={cambiarMisMedios}
          />
          {misMedios.length > 0 && (
            <label className="-mt-2 mb-4 flex items-center gap-2 text-xs text-slate-600">
              <input
                type="checkbox"
                checked={soloMios}
                onChange={(e) => setSoloMios(e.target.checked)}
                className="h-4 w-4 accent-primary-500"
              />
              Ver solo las promos que puedo usar
            </label>
          )}
        </>
      )}

      {/* Resumen: lo mejor de cada súper */}
      {!cargando && !error && porCadena.length > 0 && (
        <section className="mb-6" aria-label="Lo mejor de cada supermercado">
          <h2 className="mb-2 text-sm font-semibold text-slate-700">
            Lo mejor {esHoy ? 'de hoy' : `del ${nombreDia}`}
          </h2>
          <div className={`${FILA_DESLIZABLE} gap-3`}>
            {porCadena.map(([cadena, lista]) => {
              const mejor = lista[0];
              return (
                <button
                  key={cadena}
                  type="button"
                  onClick={() => irACadena(cadena)}
                  className="w-36 shrink-0 rounded-2xl border border-slate-200 bg-white p-3 text-left transition hover:border-primary-400"
                >
                  <p className="truncate text-xs font-semibold text-slate-500">{cadena}</p>
                  <p className="text-2xl font-bold text-primary-500">
                    {tipo === 'descuento' ? `${mejor.porcentaje}%` : `${mejor.cuotas} cuotas`}
                  </p>
                  <p className="truncate text-xs text-slate-600">{mejor.entidad}</p>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* Filtros: canal y banco */}
      {!cargando && !error && delTipo.length > 0 && (
        <div className="mb-5 space-y-2">
          <div className={FILA_DESLIZABLE}>
            {(['todos', 'presencial', 'online'] as Canal[]).map((c) => (
              <NoEncoger key={c}>
                <FilterPill active={canal === c} onClick={() => setCanal(c)}>
                  {c === 'todos' ? 'Sucursal y online' : CANAL[c]}
                </FilterPill>
              </NoEncoger>
            ))}
          </div>
          <div className={`${FILA_DESLIZABLE} sm:flex-wrap`}>
            <NoEncoger>
              <FilterPill active={entidad === null} onClick={() => setEntidad(null)}>
                Todos los bancos
              </FilterPill>
            </NoEncoger>
            {entidadesFrecuentes.map((e) => (
              <NoEncoger key={e}>
                <FilterPill active={entidad === e} onClick={() => setEntidad(entidad === e ? null : e)}>
                  {e}
                </FilterPill>
              </NoEncoger>
            ))}
          </div>
        </div>
      )}

      {/* Estados */}
      {cargando && (
        <div className="space-y-3" aria-busy="true">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-2xl bg-slate-100" />
          ))}
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      {!cargando && !error && visibles.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center">
          <p className="text-sm text-slate-600">
            No hay {tipo === 'descuento' ? 'descuentos' : 'promos en cuotas'} para el {nombreDia}
            {hayFiltros ? ' con estos filtros' : ''}.
          </p>
          {hayFiltros && (
            <button
              type="button"
              onClick={() => {
                setCanal('todos');
                setEntidad(null);
                setSoloMios(false);
              }}
              className="mt-2 text-sm font-semibold text-primary-500 hover:underline"
            >
              Quitar filtros
            </button>
          )}
        </div>
      )}

      {/* Listado por supermercado */}
      {!cargando && !error && (
        <div className="space-y-6">
          {porCadena.map(([cadena, lista]) => (
            <section key={cadena} id={idSeccion(cadena)} className="scroll-mt-24">
              <h2 className="mb-2 text-lg font-semibold text-slate-800">
                {cadena} <span className="text-sm font-normal text-slate-500">({lista.length})</span>
              </h2>
              <ul className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                {lista.map((p) => (
                  <FilaPromo key={`${p.fuente}-${p.id_origen}`} promo={p} />
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}