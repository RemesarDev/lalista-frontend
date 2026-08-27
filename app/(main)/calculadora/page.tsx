'use client';

import { useEffect, useState } from 'react';
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
import { useSerieProducto } from './_hooks/useSerieProducto';
import { useSerieTodosLosProductos } from './_hooks/useSerieTodosLosProductos';
import { GraficoInflacion } from './_components/GraficoInflacion';
import { ResumenCanasta } from './_components/ResumenCanasta';

const formateadorFecha = new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'long', year: 'numeric' });
const formatearFecha = (fechaISO: string) => formateadorFecha.format(new Date(`${fechaISO}T00:00:00Z`));

export default function CalculadoraPage() {
  const lista = useListaStore((state) => state.lista);

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

  // `useInflacion` sigue trayendo el histórico real (SEPA) y registrando el
  // seguimiento propio mes a mes en segundo plano (eso sigue siendo útil
  // aunque ya no mostremos el total combinado del carrito en pantalla — ver
  // comentario más abajo, en el selector). Solo usamos acá lo que hace
  // falta para las vistas por producto.
  const { cargandoHistoricoReal, historicoPorProductoPorClave } = useInflacion(changuitoSeleccionado, registrarPunto);

  const {
    series: seriesProductosIndec,
    cargando: cargandoIndecProductos,
    aclaraciones: aclaracionesProductosIndec,
  } = useHistoricoProductosIndec(changuitoSeleccionado);

  // null = "Todos los productos" (una línea por producto, sin sumar ni
  // promediar). Si no es null, es el id del producto puntual elegido.
  const [productoSeleccionado, setProductoSeleccionado] = useState<string | null>(null);

  // Al cambiar de changuito, volvemos siempre a "Todos los productos" (el
  // producto elegido antes podría no existir en el changuito nuevo).
  useEffect(() => {
    setProductoSeleccionado(null);
  }, [changuitoSeleccionado?.id]);

  const seriesSupermercadosProducto = useSerieProducto(
    changuitoSeleccionado,
    productoSeleccionado,
    historicoPorProductoPorClave,
  );
  const seriesTodosLosProductos = useSerieTodosLosProductos(changuitoSeleccionado, historicoPorProductoPorClave);

  const serieIndecProducto = seriesProductosIndec.find((s) => s.id === productoSeleccionado);
  const aclaracionIndecProducto = aclaracionesProductosIndec.find((a) => a.productoId === productoSeleccionado);

  const nombreProductoSeleccionado = changuitoSeleccionado?.productos.find(
    (p) => p.id === productoSeleccionado,
  )?.nombre;

  // Series y título/bajada del gráfico 1 (supermercados), según si estamos
  // viendo "todos los productos" o uno puntual.
  const seriesGraficoSupermercados = productoSeleccionado === null ? seriesTodosLosProductos : seriesSupermercadosProducto;

  return (
    <BaseContainer>
      <div className="mb-6 px-1">
        <h1 className="text-xl font-black tracking-tight text-slate-900 sm:text-2xl">
          Calculadora de inflación
        </h1>
        <p className="mt-0.5 text-[11px] font-medium text-slate-400 sm:text-xs">
          Elegí un producto de tu changuito y mirá cómo le fue al precio en tus supermercados según el SEPA
          y el INDEC
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
              Para poder ver cómo evolucionan los precios de tus productos en los supermercados.
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
              <p className="mb-3 px-1 text-[11px] font-medium text-slate-400 sm:text-xs">
                Siguiendo desde el {formatearFecha(changuitoSeleccionado.fechaInicio)} · {changuitoSeleccionado.productos.length}{' '}
                producto{changuitoSeleccionado.productos.length === 1 ? '' : 's'}
              </p>

              {/* Selector: ver todos los productos juntos (una línea por
                  producto, SIN sumar ni promediar entre ellos — evita el
                  problema del total combinado, que solo se podía calcular
                  en un mes donde TODOS los productos tuvieran precio a la
                  vez, algo que casi nunca coincidía con los datos
                  históricos reales), o un producto puntual. */}
              <div className="mb-5 flex flex-wrap items-center gap-2 px-1">
                <button
                  type="button"
                  onClick={() => setProductoSeleccionado(null)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-bold transition-all ${
                    productoSeleccionado === null
                      ? 'border-transparent bg-primary-500 text-white'
                      : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  Todos los productos
                </button>
                {changuitoSeleccionado.productos.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setProductoSeleccionado(p.id)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-bold transition-all ${
                      productoSeleccionado === p.id
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

              {/* Gráfico 1: precio en tus supermercados (SEPA) — sin
                  mezclar con el INDEC, para que quede claro de un vistazo
                  que esto es "tus supermercados". */}
              <div className="mb-8">
                <h2 className="mb-1 px-1 text-sm font-black text-slate-900 sm:text-base">
                  Precio en tus supermercados
                </h2>
                <p className="mb-3 px-1 text-[11px] text-slate-400">
                  {productoSeleccionado === null
                    ? 'Precio histórico real de cada producto de tu changuito (datos oficiales SEPA) — una línea por producto, en el supermercado con más historial disponible para cada uno.'
                    : (
                      <>
                        Precio histórico real de{' '}
                        <span className="font-bold text-slate-500">{nombreProductoSeleccionado}</span> en cada
                        supermercado de este changuito (datos oficiales SEPA).
                      </>
                    )}
                </p>

                {seriesGraficoSupermercados.length === 0 && !cargandoHistoricoReal ? (
                  <p className="rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-6 text-center text-xs text-slate-400">
                    {productoSeleccionado === null
                      ? 'Todavía no hay precios históricos reales cargados para los productos de este changuito.'
                      : (
                        <>
                          Todavía no hay precios históricos reales cargados para{' '}
                          <span className="font-bold text-slate-500">{nombreProductoSeleccionado}</span> en los
                          supermercados de este changuito.
                        </>
                      )}
                  </p>
                ) : (
                  <GraficoInflacion series={seriesGraficoSupermercados} />
                )}
              </div>

              {/* Gráfico 2: según el INDEC — separado, es otra fuente de
                  datos (el índice oficial de inflación, no un
                  supermercado puntual). En "Todos los productos" muestra
                  una línea por cada producto que matchea alguna categoría
                  INDEC; en un producto puntual, solo la de ese producto. */}
              <div className="mb-8">
                <h2 className="mb-1 px-1 text-sm font-black text-slate-900 sm:text-base">Según el INDEC</h2>
                <p className="mb-3 px-1 text-[11px] text-slate-400">
                  {productoSeleccionado === null
                    ? 'Evolución oficial de las categorías del INDEC más parecidas a los productos de tu changuito — no es tu marca exacta, es la categoría genérica más cercana.'
                    : serieIndecProducto
                      ? 'Evolución oficial de la categoría más parecida que publica el INDEC — no es tu marca exacta, es la categoría genérica más cercana.'
                      : 'Referencia de precios: cómo evolucionó, según el INDEC, la categoría genérica más parecida a este producto.'}
                </p>

                {productoSeleccionado === null ? (
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