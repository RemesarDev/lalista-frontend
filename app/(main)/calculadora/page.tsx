'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  ArrowsClockwiseIcon,
  ChartLineUpIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  ShoppingCartIcon,
  XIcon,
} from '@phosphor-icons/react/dist/ssr';
import BaseContainer from '@/app/_components/global/BaseContainer';
import { DesktopActionButton } from '@/app/_components/global/DesktopActionButton';
import { useListaStore } from '@/app/_store/store';
import { useChanguitos } from './_hooks/useChanguitos';
import { useInflacion } from './_hooks/useInflacion';
import { useHistoricoProductosIndec } from './_hooks/useHistoricoProductosIndec';
import { useHistoricoProvincia } from './_hooks/useHistoricoProvincia';
import { PROVINCIAS_PARA_SELECTOR, obtenerCodigoProvincia } from './_lib/provincias';
import { GraficoInflacion } from './_components/GraficoInflacion';
import { ResumenCanasta } from './_components/ResumenCanasta';

const formateadorFecha = new Intl.DateTimeFormat('es-AR', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
});
const formatearFecha = (fechaISO: string) => formateadorFecha.format(new Date(`${fechaISO}T00:00:00Z`));

export default function CalculadoraPage() {
  const lista = useListaStore((state) => state.lista);
  const nombreLugar = useListaStore((state) => state.ubicacion.nombreLugar);

  // Provincia elegida a mano. Arranca en la que se deduce de la ubicación
  // (si se pudo) y si no, en Buenos Aires, que es la única con datos hoy.
  // Se elige explícitamente porque la ubicación no siempre trae un nombre
  // que permita deducirla (ej: queda "Ubicación detectada").
  const [provincia, setProvincia] = useState<string>(
    () => obtenerCodigoProvincia(nombreLugar) ?? 'AR-B',
  );

  const {
    changuitos,
    changuitoSeleccionado,
    seleccionarChanguito,
    cargado,
    iniciarSeguimiento,
    registrarPunto,
    eliminarChanguito,
  } = useChanguitos();

  const manejarEliminar = (id: string, nombre: string) => {
    if (window.confirm(`¿Eliminar "${nombre}"? Se va a perder todo el seguimiento guardado.`)) {
      eliminarChanguito(id);
    }
  };

  // `useInflacion` sigue registrando el seguimiento propio mes a mes en
  // segundo plano (precio de hoy en cada supermercado congelado) — eso
  // alimenta el resumen de "Este changuito" más abajo, es independiente
  // del gráfico de histórico SEPA.
  useInflacion(changuitoSeleccionado, registrarPunto);

  // Histórico SEPA promediado entre TODOS los supermercados de la provincia.
  const {
    porProducto: seriesPorProductoProvincia,
    total: serieTotalProvincia,
    indecGeneral: serieIndecGeneral,
    cargando: cargandoHistoricoReal,
  } = useHistoricoProvincia(changuitoSeleccionado, provincia);

  // Rango de meses que cubre el histórico SEPA — se lo pasamos al INDEC
  // para que las dos secciones muestren el MISMO tramo de tiempo y se
  // puedan comparar de un vistazo (el INDEC publica desde 2016, y sin
  // recortar la línea se ve mucho más "explosiva" solo por abarcar más).
  const rangoSepa = useMemo(() => {
    const fechas = seriesPorProductoProvincia.flatMap((s) => s.puntos.map((p) => p.fecha.slice(0, 7)));
    if (!fechas.length) return null;
    return { desde: fechas.reduce((a, b) => (a < b ? a : b)), hasta: fechas.reduce((a, b) => (a > b ? a : b)) };
  }, [seriesPorProductoProvincia]);

  const {
    series: seriesProductosIndec,
    cargando: cargandoIndecProductos,
    categoriaPorProducto,
    aclaraciones: aclaracionesProductosIndec,
  } = useHistoricoProductosIndec(changuitoSeleccionado, rangoSepa);

  // 'total' = changuito completo (un solo número combinado). 'todos' = una
  // línea por producto. Cualquier otro valor es el id de un producto puntual.
  const [vista, setVista] = useState<'total' | 'todos' | string>('todos');

  // Al cambiar de changuito, volvemos siempre a "Por producto" (el
  // producto elegido antes podría no existir en el changuito nuevo).
  useEffect(() => {
    setVista('todos');
  }, [changuitoSeleccionado?.id]);

  // La serie del INDEC está agrupada por categoría, así que para un
  // producto puntual hay que traducir primero su id al de su categoría.
  const serieIndecProducto = seriesProductosIndec.find(
    (s) => s.id === categoriaPorProducto.get(vista),
  );
  const aclaracionIndecProducto = aclaracionesProductosIndec.find((a) => a.productoId === vista);

  const nombreProductoSeleccionado = changuitoSeleccionado?.productos.find((p) => p.id === vista)?.nombre;

  // Series del gráfico 1, según la vista elegida.
  const seriesGraficoSupermercados =
    vista === 'total'
      ? serieTotalProvincia
        ? [serieTotalProvincia]
        : []
      : vista === 'todos'
        ? seriesPorProductoProvincia
        : seriesPorProductoProvincia.filter((s) => s.id === vista);

  return (
    <BaseContainer>
      <div className="mb-6 px-1">
        <h1 className="text-xl font-black tracking-tight text-slate-900 sm:text-2xl">
          Calculadora de inflación
        </h1>
        <p className="mt-0.5 text-[11px] font-medium text-slate-400 sm:text-xs">
          Elegí tu changuito completo o un producto puntual y mirá cómo le fue el precio en tu provincia según el
          SEPA, y cómo le fue según el INDEC
        </p>
      </div>

      {!cargado ? null : changuitos.length === 0 ? (
        lista.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-10 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-50 text-slate-400">
              <ShoppingCartIcon size={22} weight="light" />
            </div>
            <h3 className="mt-4 text-sm font-bold text-slate-900">Todavía no tenés productos en tu lista</h3>
            <p className="mt-1 mb-5 text-xs text-slate-400">
              Agregá productos a tu lista para poder empezar a seguir cómo evoluciona su precio.
            </p>
            <DesktopActionButton
              href="/buscar"
              label="Buscar productos"
              icon={<MagnifyingGlassIcon weight="bold" />}
              color="lila"
            />
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-10 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary-50 text-primary-500">
              <ChartLineUpIcon size={22} weight="light" />
            </div>
            <h3 className="mt-4 text-sm font-bold text-slate-900">Empezá a seguir este changuito</h3>
            <p className="mt-1 mb-5 text-xs text-slate-400">
              Le damos seguimiento a los productos que elegis y todos los meses vamos a ver cómo les fue con el
              precio a cada uno, comparado con el INDEC.
            </p>
            <DesktopActionButton
              onClick={() => iniciarSeguimiento(lista)}
              label="Empezar a seguir"
              icon={<ChartLineUpIcon weight="bold" />}
              color="lila"
              variant="solid"
            />
          </div>
        )
      ) : (
        <>
          {/* Selector de changuitos: se pueden tener varios en simultáneo */}
          <div className="mb-4 flex flex-wrap items-center gap-2 px-1">
            {changuitos.map((ch) => (
              <div
                key={ch.id}
                className={`flex items-center gap-1 rounded-full border pl-3 pr-1.5 py-1.5 text-xs font-bold transition-all ${
                  changuitoSeleccionado?.id === ch.id
                    ? 'border-transparent bg-slate-900 text-white'
                    : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
                }`}
              >
                <button type="button" onClick={() => seleccionarChanguito(ch.id)}>
                  {ch.nombre}
                </button>
                <button
                  type="button"
                  onClick={() => manejarEliminar(ch.id, ch.nombre)}
                  aria-label={`Eliminar ${ch.nombre}`}
                  className={`rounded-full p-0.5 ${
                    changuitoSeleccionado?.id === ch.id ? 'hover:bg-white/20' : 'hover:bg-slate-100'
                  }`}
                >
                  <XIcon size={11} weight="bold" />
                </button>
              </div>
            ))}

            {lista.length > 0 && (
              <button
                type="button"
                onClick={() => iniciarSeguimiento(lista)}
                className="inline-flex items-center gap-1 rounded-full border border-dashed border-slate-300 px-3 py-1.5 text-xs font-bold text-slate-400 hover:bg-slate-50"
              >
                <PlusIcon size={12} weight="bold" />
                Seguir mi lista actual
              </button>
            )}
          </div>

          {changuitoSeleccionado && (
            <>
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2 px-1">
                <p className="text-[11px] font-medium text-slate-400 sm:text-xs">
                  Siguiendo desde el {formatearFecha(changuitoSeleccionado.fechaInicio)} ·{' '}
                  {changuitoSeleccionado.productos.length} producto
                  {changuitoSeleccionado.productos.length === 1 ? '' : 's'}
                </p>

                {/* Selector de provincia: el histórico del SEPA está guardado
                    por provincia, así que hace falta saber cuál mirar. No se
                    deduce siempre bien de la ubicación, por eso se elige. */}
                <label className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400 sm:text-xs">
                  Provincia:
                  <select
                    value={provincia}
                    onChange={(e) => setProvincia(e.target.value)}
                    className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-bold text-slate-600 sm:text-xs"
                  >
                    {PROVINCIAS_PARA_SELECTOR.map((p) => (
                      <option key={p.codigo} value={p.codigo}>
                        {p.nombre}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              {/* Selector: changuito completo (un solo número, promediando
                  el precio de cada producto entre todos los supermercados
                  de tu provincia y sumando — solo en los meses donde TODOS
                  los productos tienen dato), todos los productos por
                  separado (una línea por producto, sin sumar), o un
                  producto puntual. */}
              <div className="mb-5 flex flex-wrap items-center gap-2 px-1">
                <button
                  type="button"
                  onClick={() => setVista('total')}
                  className={`rounded-full border px-3 py-1.5 text-xs font-bold transition-all ${
                    vista === 'total'
                      ? 'border-transparent bg-primary-500 text-white'
                      : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  Total
                </button>
                <button
                  type="button"
                  onClick={() => setVista('todos')}
                  className={`rounded-full border px-3 py-1.5 text-xs font-bold transition-all ${
                    vista === 'todos'
                      ? 'border-transparent bg-primary-500 text-white'
                      : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  Por producto
                </button>
                {changuitoSeleccionado.productos.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setVista(p.id)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-bold transition-all ${
                      vista === p.id
                        ? 'border-transparent bg-primary-500 text-white'
                        : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    {p.nombre}
                  </button>
                ))}
              </div>

              {(cargandoHistoricoReal || cargandoIndecProductos) && (
                <span className="mb-3 inline-flex items-center gap-1 px-1 text-[11px] font-semibold text-slate-400">
                  <ArrowsClockwiseIcon size={12} className="animate-spin" />
                  Actualizando…
                </span>
              )}

              {/* Gráfico 1: precio en tu provincia (SEPA) — promediado
                  entre todos los supermercados de la provincia elegida.
                  Sin mezclar con el INDEC. */}
              <div className="mb-8">
                <h2 className="mb-1 px-1 text-sm font-black text-slate-900 sm:text-base">
                  Precio en tu provincia
                </h2>
                <p className="mb-3 px-1 text-[11px] text-slate-400">
                  {vista === 'total'
                    ? 'Precio histórico de tu changuito completo: la suma de tus productos, promediando cada uno entre todos los supermercados de tu provincia (datos oficiales SEPA) — solo en los meses donde todos los productos tienen dato.'
                    : vista === 'todos'
                      ? 'Precio histórico de cada producto de tu changuito, promediado entre todos los supermercados de tu provincia (datos oficiales SEPA) — una línea por producto.'
                      : (
                        <>
                          Precio histórico de{' '}
                          <span className="font-bold text-slate-500">{nombreProductoSeleccionado}</span>, promediado
                          entre todos los supermercados de tu provincia (datos oficiales SEPA).
                        </>
                      )}
                </p>

                {seriesGraficoSupermercados.length === 0 && !cargandoHistoricoReal ? (
                  <p className="rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-6 text-center text-xs text-slate-400">
                    {vista === 'total'
                      ? 'Todavía no hay un mes en el que TODOS los productos de este changuito tengan precio SEPA en esta provincia.'
                      : vista === 'todos'
                        ? 'El SEPA todavía no publicó historial para los productos de este changuito en esta provincia.'
                        : (
                          <>
                            El SEPA todavía no publicó historial para{' '}
                            <span className="font-bold text-slate-500">{nombreProductoSeleccionado}</span> en esta
                            provincia.
                          </>
                        )}
                  </p>
                ) : (
                  <GraficoInflacion series={seriesGraficoSupermercados} />
                )}
              </div>

              {/* Gráfico 2: según el INDEC — separado, es otra fuente de
                  datos (el índice oficial de inflación, no un
                  supermercado puntual).
                  - "Total": el IPC Nivel General (la inflación oficial),
                    recortado al mismo tramo de meses que el gráfico de
                    arriba, para poder responder "¿mi changuito subió más o
                    menos que la inflación?".
                  - "Por producto": una línea por cada categoría INDEC que
                    matchean los productos.
                  - Producto puntual: solo la categoría de ese producto. */}
              <div className="mb-8">
                <h2 className="mb-1 px-1 text-sm font-black text-slate-900 sm:text-base">Según el INDEC</h2>
                <p className="mb-3 px-1 text-[11px] text-slate-400">
                  {vista === 'total'
                    ? 'Inflación oficial (IPC Nivel General del INDEC) en el mismo período que el gráfico de arriba — mide todos los rubros, no solo alimentos, pero es la referencia con la que se compara habitualmente.'
                    : vista === 'todos'
                      ? 'Evolución oficial de las categorías del INDEC más parecidas a los productos de tu changuito — no es tu marca exacta, es la categoría genérica más cercana.'
                      : serieIndecProducto
                        ? 'Evolución oficial de la categoría más parecida que publica el INDEC — no es tu marca exacta, es la categoría genérica más cercana.'
                        : 'Referencia de precios: cómo evolucionó, según el INDEC, la categoría genérica más parecida a este producto.'}
                </p>

                {vista === 'total' ? (
                  serieIndecGeneral ? (
                    <GraficoInflacion series={[serieIndecGeneral]} height={200} />
                  ) : cargandoHistoricoReal ? (
                    <p className="px-1 text-xs text-slate-400">Cargando…</p>
                  ) : (
                    <p className="rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-6 text-center text-xs text-slate-400">
                      No se pudo traer el índice general del INDEC para este período.
                    </p>
                  )
                ) : vista === 'todos' ? (
                  seriesProductosIndec.length > 0 ? (
                    <>
                      <GraficoInflacion series={seriesProductosIndec} height={200} />
                      {aclaracionesProductosIndec.length > 0 && (
                        <ul className="mt-2 space-y-1 px-1">
                          {aclaracionesProductosIndec.map((a) => (
                            <li key={a.productoId} className="text-[10px] leading-relaxed text-slate-400">
                              <span className="font-bold text-slate-500">{a.nombreProducto}:</span> {a.aclaracion}
                            </li>
                          ))}
                        </ul>
                      )}
                    </>
                  ) : cargandoIndecProductos ? (
                    <p className="px-1 text-xs text-slate-400">Cargando…</p>
                  ) : (
                    <p className="rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-6 text-center text-xs text-slate-400">
                      Ninguno de los productos de este changuito matchea con una categoría del INDEC.
                    </p>
                  )
                ) : serieIndecProducto ? (
                  <>
                    <GraficoInflacion series={[serieIndecProducto]} height={200} />
                    {aclaracionIndecProducto && (
                      <p className="mt-2 px-1 text-[10px] leading-relaxed text-slate-400">
                        {aclaracionIndecProducto.aclaracion}
                      </p>
                    )}
                  </>
                ) : cargandoIndecProductos ? (
                  <p className="px-1 text-xs text-slate-400">Cargando…</p>
                ) : (
                  <p className="rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-6 text-center text-xs text-slate-400">
                    El INDEC no publica una categoría genérica parecida a{' '}
                    <span className="font-bold text-slate-500">{nombreProductoSeleccionado}</span>.
                  </p>
                )}
              </div>

              <div className="mt-2">
                <h2 className="mb-3 px-1 text-sm font-black text-slate-900 sm:text-base">Este changuito</h2>
                <ResumenCanasta changuito={changuitoSeleccionado} />
              </div>
            </>
          )}
        </>
      )}
    </BaseContainer>
  );
}