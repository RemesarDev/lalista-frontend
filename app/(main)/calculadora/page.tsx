'use client';

import {
  ArrowsClockwiseIcon,
  ChartLineUpIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  ShoppingCartIcon,
  WarningCircleIcon,
  XIcon,
} from '@phosphor-icons/react/dist/ssr';
import BaseContainer from '@/app/_components/global/BaseContainer';
import { DesktopActionButton } from '@/app/_components/global/DesktopActionButton';
import { useListaStore } from '@/app/_store/store';
import { useChanguitos } from './_hooks/useChanguitos';
import { useInflacion } from './_hooks/useInflacion';
import { useHistoricoProductosIndec } from './_hooks/useHistoricoProductosIndec';
import { GraficoInflacion } from './_components/GraficoInflacion';
import { ToggleSerie } from './_components/ToggleSerie';
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

  const { series, toggleSerie, cargandoIndec, errorIndec, actualizandoPrecios, tieneUbicacionValida } =
    useInflacion(changuitoSeleccionado, registrarPunto);

  const {
    series: seriesProductosIndec,
    cargando: cargandoProductosIndec,
    aclaraciones: aclaracionesProductosIndec,
  } = useHistoricoProductosIndec(changuitoSeleccionado);

  return (
    <BaseContainer>
      <div className="mb-6 px-1">
        <h1 className="text-xl font-black tracking-tight text-slate-900 sm:text-2xl">
          Calculadora de inflación
        </h1>
        <p className="mt-0.5 text-[11px] font-medium text-slate-400 sm:text-xs">
          Cómo les fue a los supermercados de tu zona con los precios, comparado con el INDEC
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
              Tomamos una foto de los {lista.length} producto{lista.length === 1 ? '' : 's'} que tenés hoy, y de
              hasta 3 supermercados donde te sale más barato — y todos los meses vamos a ver cómo les fue con el
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
              <p className="mb-4 px-1 text-[11px] font-medium text-slate-400 sm:text-xs">
                Siguiendo desde el {formatearFecha(changuitoSeleccionado.fechaInicio)} · {changuitoSeleccionado.productos.length}{' '}
                producto{changuitoSeleccionado.productos.length === 1 ? '' : 's'}
              </p>

              {/* Toggles: independientes entre sí — se puede ver una línea, varias, o todas */}
              <div className="mb-4 flex flex-wrap items-center gap-2 px-1">
                {series.map((serie) => (
                  <ToggleSerie
                    key={serie.id}
                    label={serie.nombre}
                    color={serie.color}
                    activo={serie.visible}
                    onToggle={() => toggleSerie(serie.id)}
                  />
                ))}

                {(cargandoIndec || actualizandoPrecios) && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400">
                    <ArrowsClockwiseIcon size={12} className="animate-spin" />
                    Actualizando…
                  </span>
                )}
                {errorIndec && !cargandoIndec && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600">
                    <WarningCircleIcon size={12} weight="bold" />
                    No se pudo cargar el INDEC
                  </span>
                )}
              </div>

              <GraficoInflacion series={series} />

              <p className="mt-2 px-1 text-[10px] leading-relaxed text-slate-300">
                {changuitoSeleccionado.historialPorSupermercado[0]?.puntos.length < 3
                  ? 'Todavía es un seguimiento nuevo, por eso las líneas son cortas — van a ir creciendo un punto por mes. '
                  : ''}
                Cada línea sigue el precio real de los mismos productos en el mismo supermercado, mes a mes
                {tieneUbicacionValida ? '' : ' (activá tu ubicación para que el precio se actualice)'}.
              </p>

              <div className="mt-6">
                <h2 className="mb-3 px-1 text-sm font-black text-slate-900 sm:text-base">Este changuito</h2>
                <ResumenCanasta changuito={changuitoSeleccionado} />
              </div>

              {(seriesProductosIndec.length > 0 || cargandoProductosIndec) && (
                <div className="mt-8 border-t border-slate-100 pt-6">
                  <h2 className="mb-1 px-1 text-sm font-black text-slate-900 sm:text-base">
                    Contexto: categorías similares según el INDEC
                  </h2>
                  <p className="mb-3 px-1 text-[11px] text-slate-400">
                    Historia completa desde 2016 de los productos genéricos que el INDEC publica y más se
                    parecen a los de tu changuito — no son tu marca exacta, es la categoría más cercana.
                  </p>
                  {cargandoProductosIndec ? (
                    <p className="px-1 text-xs text-slate-400">Cargando…</p>
                  ) : (
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
                  )}
                </div>
              )}
            </>
          )}
        </>
      )}
    </BaseContainer>
  );
}