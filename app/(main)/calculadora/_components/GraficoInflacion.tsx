'use client';

import { useMemo, useRef, useState } from 'react';
import type { SerieInflacion } from '../_types/inflacion';

interface GraficoInflacionProps {
  series: SerieInflacion[];
  height?: number;
}

// Sistema de coordenadas interno del SVG (unidades lógicas, no píxeles reales).
const VB_ANCHO = 720;
const PADDING = { top: 20, right: 16, bottom: 28, left: 44 };

const parsearFecha = (fechaISO: string) => new Date(`${fechaISO}T00:00:00Z`).getTime();

const formateadorMes = new Intl.DateTimeFormat('es-AR', {
  month: 'short',
  year: '2-digit',
  timeZone: 'UTC',
});
const formatearMes = (fechaISO: string) => {
  const texto = formateadorMes.format(new Date(`${fechaISO}T00:00:00Z`));
  return texto.charAt(0).toUpperCase() + texto.slice(1).replace('.', '');
};

/** Redondea el eje Y a números "prolijos" (10, 20, 25, 50, 100...). */
function calcularEjeY(valorMin: number, valorMax: number) {
  // Si toda la serie es plana o vacía, damos un rango mínimo usable.
  if (valorMax === valorMin) return { min: Math.min(0, valorMin), max: valorMax + 10, paso: 2 };

  const rango = valorMax - valorMin;
  const pasoBruto = rango / 4;
  const magnitud = Math.pow(10, Math.floor(Math.log10(pasoBruto)));
  const normalizado = pasoBruto / magnitud;
  let paso: number;
  if (normalizado <= 1) paso = 1 * magnitud;
  else if (normalizado <= 2) paso = 2 * magnitud;
  else if (normalizado <= 5) paso = 5 * magnitud;
  else paso = 10 * magnitud;

  return {
    min: Math.floor(valorMin / paso) * paso,
    max: Math.ceil(valorMax / paso) * paso,
    paso,
  };
}

export function GraficoInflacion({ series, height = 240 }: GraficoInflacionProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  const seriesConDatos = series.filter((s) => s.puntos.length > 0);

  const { fechaMin, fechaMax, ejeY, altoGrafico, anchoGrafico, xScale, yScale, fechasUnion } =
    useMemo(() => {
      const todosPuntos = seriesConDatos.flatMap((s) => s.puntos);
      const fechasMs = todosPuntos.map((p) => parsearFecha(p.fecha));
      const fMin = fechasMs.length ? Math.min(...fechasMs) : 0;
      const fMax = fechasMs.length ? Math.max(...fechasMs) : 0;

      const porcentajes = todosPuntos.map((p) => p.porcentaje);
      // El eje incluye siempre el 0 (línea de base del seguimiento) y se
      // estira hacia abajo si algún producto BAJÓ de precio.
      const valorMax = Math.max(0, ...porcentajes);
      const valorMin = Math.min(0, ...porcentajes);
      const eje = calcularEjeY(valorMin, valorMax);

      const alto = height - PADDING.top - PADDING.bottom;
      const ancho = VB_ANCHO - PADDING.left - PADDING.right;

      const xS = (fechaMsVal: number) =>
        fMax === fMin
          ? PADDING.left + ancho / 2
          : PADDING.left + ((fechaMsVal - fMin) / (fMax - fMin)) * ancho;

      const rangoY = eje.max - eje.min || 1;
      const yS = (valor: number) => PADDING.top + alto - ((valor - eje.min) / rangoY) * alto;

      // Fechas únicas ordenadas (para el eje X y para ubicar el hover por índice)
      const setFechas = Array.from(new Set(todosPuntos.map((p) => p.fecha))).sort();

      return {
        fechaMin: fMin,
        fechaMax: fMax,
        ejeY: eje,
        altoGrafico: alto,
        anchoGrafico: ancho,
        xScale: xS,
        yScale: yS,
        fechasUnion: setFechas,
      };
    }, [seriesConDatos, height]);

  const ticksY = useMemo(() => {
    const cant = Math.round((ejeY.max - ejeY.min) / ejeY.paso);
    return Array.from({ length: cant + 1 }, (_, i) => ejeY.min + i * ejeY.paso);
  }, [ejeY]);

  // Etiquetas del eje X a intervalos PAREJOS de meses (3, 6 o 12 según el
  // rango), contando desde el último mes hacia atrás — así la fecha final
  // siempre queda etiquetada y los saltos entre etiquetas son iguales.
  const ticksX = useMemo(() => {
    if (fechasUnion.length <= 6) return fechasUnion;

    // Elegimos el salto que deje ~6 etiquetas o menos.
    const SALTOS_POSIBLES = [1, 2, 3, 6, 12, 24];
    const salto =
      SALTOS_POSIBLES.find((s) => Math.ceil(fechasUnion.length / s) <= 6) ??
      Math.ceil(fechasUnion.length / 6);

    const elegidas: string[] = [];
    for (let i = fechasUnion.length - 1; i >= 0; i -= salto) {
      elegidas.unshift(fechasUnion[i]);
    }
    return elegidas;
  }, [fechasUnion]);

  // Posición de la etiqueta de valor al final de cada línea visible — se
  // acomodan de arriba hacia abajo con un espacio mínimo entre ellas para
  // que no se solapen, sin importar cuántas series haya.
  const etiquetasFinales = useMemo(() => {
    const ESPACIO_MINIMO = 13;
    const crudas = seriesConDatos
      .filter((s) => s.visible && s.puntos.length > 0)
      .map((s) => {
        const ultimo = s.puntos.at(-1)!;
        return {
          id: s.id,
          x: xScale(parsearFecha(ultimo.fecha)),
          y: yScale(ultimo.porcentaje),
          valor: ultimo.porcentaje,
        };
      })
      .sort((a, b) => a.y - b.y);

    for (let i = 1; i < crudas.length; i++) {
      if (crudas[i].y - crudas[i - 1].y < ESPACIO_MINIMO) {
        crudas[i].y = crudas[i - 1].y + ESPACIO_MINIMO;
      }
    }
    return crudas;
  }, [seriesConDatos, xScale, yScale]);

  const manejarPointerMove = (e: React.PointerEvent<SVGRectElement>) => {
    const svg = svgRef.current;
    if (!svg || fechasUnion.length === 0) return;
    const rect = svg.getBoundingClientRect();
    const xPx = e.clientX - rect.left;
    const xVB = (xPx / rect.width) * VB_ANCHO;
    const fechaHoverMs = fechaMin + ((xVB - PADDING.left) / anchoGrafico) * (fechaMax - fechaMin);

    let mejorIdx = 0;
    let mejorDist = Infinity;
    fechasUnion.forEach((f, i) => {
      const dist = Math.abs(parsearFecha(f) - fechaHoverMs);
      if (dist < mejorDist) {
        mejorDist = dist;
        mejorIdx = i;
      }
    });
    setHoverIdx(mejorIdx);
  };

  const fechaHover = hoverIdx !== null ? fechasUnion[hoverIdx] : null;

  return (
    <div className="w-full">
      <div className="relative w-full" style={{ height }}>
        <svg
          ref={svgRef}
          viewBox={`0 0 ${VB_ANCHO} ${height}`}
          preserveAspectRatio="none"
          className="block w-full h-full overflow-visible"
          role="img"
          aria-label="Gráfico de evolución de precios en el tiempo"
        >
          {/* Recorte del área de dibujo: las LÍNEAS no pueden salirse del
              cuadro (si un producto se va de escala, se corta en el borde),
              pero las etiquetas de valor quedan fuera del clip para poder
              respirar en el margen derecho. */}
          <defs>
            <clipPath id="recorte-area-grafico">
              <rect
                x={PADDING.left}
                y={PADDING.top}
                width={anchoGrafico}
                height={altoGrafico}
              />
            </clipPath>
          </defs>

          {/* Gridlines horizontales */}
          {ticksY.map((valor) => (
            <line
              key={valor}
              x1={PADDING.left}
              x2={VB_ANCHO - PADDING.right}
              y1={yScale(valor)}
              y2={yScale(valor)}
              stroke={valor === 0 ? 'var(--color-slate-300)' : 'var(--color-slate-200)'}
              strokeWidth={1}
            />
          ))}

          {/* Etiquetas eje Y */}
          {ticksY.map((valor) => (
            <text
              key={valor}
              x={PADDING.left - 8}
              y={yScale(valor)}
              textAnchor="end"
              dominantBaseline="middle"
              className="fill-slate-400"
              fontSize={11}
            >
              {valor}%
            </text>
          ))}

          {/* Etiquetas eje X */}
          {ticksX.map((fecha) => (
            <text
              key={fecha}
              x={xScale(parsearFecha(fecha))}
              y={height - PADDING.bottom + 18}
              textAnchor="middle"
              className="fill-slate-400"
              fontSize={11}
            >
              {formatearMes(fecha)}
            </text>
          ))}

          {/* Líneas de crosshair */}
          {fechaHover && (
            <line
              x1={xScale(parsearFecha(fechaHover))}
              x2={xScale(parsearFecha(fechaHover))}
              y1={PADDING.top}
              y2={height - PADDING.bottom}
              stroke="var(--color-slate-300)"
              strokeWidth={1}
              strokeDasharray="3,3"
            />
          )}

          {/* Series */}
          {seriesConDatos.map((serie) => {
            if (!serie.visible) return null;

            const puntosSvg = serie.puntos.map((p) => ({
              x: xScale(parsearFecha(p.fecha)),
              y: yScale(p.porcentaje),
            }));
            const path = puntosSvg
              .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
              .join(' ');
            const ultimo = puntosSvg.at(-1);
            const ultimoValor = serie.puntos.at(-1)?.porcentaje ?? 0;

            return (
              <g key={serie.id}>
                <g clipPath="url(#recorte-area-grafico)">
                  <path
                    d={path}
                    fill="none"
                    stroke={serie.color}
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeDasharray={serie.estiloLinea === 'punteado' ? '7,5' : undefined}
                  />
                  {ultimo && (
                    <circle
                      cx={ultimo.x}
                      cy={ultimo.y}
                      r={5}
                      fill={serie.color}
                      stroke="white"
                      strokeWidth={2}
                    />
                  )}
                </g>
                {ultimo &&
                  (() => {
                    const etiqueta = etiquetasFinales.find((e) => e.id === serie.id);
                    if (!etiqueta) return null;
                    return (
                      <text
                        x={etiqueta.x}
                        y={etiqueta.y}
                        textAnchor="end"
                        fontSize={11}
                        fontWeight={700}
                        className="fill-slate-700"
                      >
                        {ultimoValor > 0 ? '+' : ''}
                        {ultimoValor}%
                      </text>
                    );
                  })()}
              </g>
            );
          })}

          {/* Overlay invisible para capturar el mouse/touch en toda el área del gráfico */}
          <rect
            x={PADDING.left}
            y={PADDING.top}
            width={anchoGrafico}
            height={altoGrafico}
            fill="transparent"
            onPointerMove={manejarPointerMove}
            onPointerLeave={() => setHoverIdx(null)}
          />
        </svg>

        {/* Tooltip */}
        {fechaHover && (
          <div
            className="pointer-events-none absolute top-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-md"
            style={{
              left: `${(xScale(parsearFecha(fechaHover)) / VB_ANCHO) * 100}%`,
              transform:
                xScale(parsearFecha(fechaHover)) > VB_ANCHO / 2
                  ? 'translateX(-105%)'
                  : 'translateX(10px)',
            }}
          >
            <p className="mb-1 font-bold text-slate-900">{formatearMes(fechaHover)}</p>
            {seriesConDatos
              .filter((s) => s.visible)
              .map((s) => {
                const punto = s.puntos.find((p) => p.fecha === fechaHover);
                if (!punto) return null;
                return (
                  <p key={s.id} className="flex items-center gap-1.5 text-slate-500">
                    <span
                      className="inline-block h-0.5 w-3"
                      style={{ backgroundColor: s.color }}
                      aria-hidden
                    />
                    <span>{s.nombre}:</span>
                    <span className="font-bold text-slate-900">
                      {punto.porcentaje > 0 ? '+' : ''}
                      {punto.porcentaje}%
                    </span>
                  </p>
                );
              })}
          </div>
        )}
      </div>

      {/* Leyenda */}
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 px-1">
        {seriesConDatos.map((serie) => (
          <div key={serie.id} className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
            <svg width={16} height={8} aria-hidden>
              <line
                x1={0}
                x2={16}
                y1={4}
                y2={4}
                stroke={serie.color}
                strokeWidth={2}
                strokeDasharray={serie.estiloLinea === 'punteado' ? '4,3' : undefined}
              />
            </svg>
            {serie.nombre}
          </div>
        ))}
      </div>

      {/* Tabla accesible (alternativa al gráfico, siempre disponible) */}
      <details className="mt-3 px-1">
        <summary className="cursor-pointer text-xs font-semibold text-slate-400 hover:text-slate-600">
          Ver como tabla
        </summary>
        <div className="mt-2 max-h-48 overflow-y-auto rounded-lg border border-slate-100">
          <table className="w-full text-left text-xs">
            <thead className="sticky top-0 bg-slate-50 text-slate-500">
              <tr>
                <th className="px-2 py-1.5 font-semibold">Mes</th>
                {seriesConDatos.map((s) => (
                  <th key={s.id} className="px-2 py-1.5 font-semibold">
                    {s.nombre}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {fechasUnion.map((fecha) => (
                <tr key={fecha} className="border-t border-slate-100">
                  <td className="px-2 py-1.5 text-slate-600">{formatearMes(fecha)}</td>
                  {seriesConDatos.map((s) => {
                    const punto = s.puntos.find((p) => p.fecha === fecha);
                    return (
                      <td key={s.id} className="px-2 py-1.5 font-semibold text-slate-800">
                        {punto ? `${punto.porcentaje > 0 ? '+' : ''}${punto.porcentaje}%` : '—'}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}