'use client';

import { useId, useMemo, useState, type KeyboardEvent } from 'react';

// Buscador de "¿Con qué pagás?": el usuario escribe su banco o billetera,
// ve sugerencias (aunque lo escriba mal) y lo agrega a su lista.
// Se usa en /promociones y en /comparativa.

/** Pasa a minúsculas y saca acentos: "Nación" -> "nacion". */
const normalizar = (texto: string) =>
  texto.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();

/** Cantidad de letras a cambiar para pasar de una palabra a otra (distancia de Levenshtein). */
function distancia(a: string, b: string) {
  const fila = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let anterior = fila[0];
    fila[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const temporal = fila[j];
      fila[j] = Math.min(fila[j] + 1, fila[j - 1] + 1, anterior + (a[i - 1] === b[j - 1] ? 0 : 1));
      anterior = temporal;
    }
  }
  return fila[b.length];
}

/**
 * Busca bancos parecidos a lo que escribió el usuario:
 * 1. Los que contienen el texto (los que empiezan igual, primero).
 * 2. Si no hay ninguno (escribió mal), los que empiezan con la misma letra,
 *    ordenados por cuán parecidos son.
 */
function buscarParecidos(texto: string, opciones: string[], maximo = 6) {
  const q = normalizar(texto);
  if (!q) return [];

  const puntaje = (nombre: string) => {
    const n = normalizar(nombre);
    const palabras = n.split(/\s+/);
    if (n.startsWith(q)) return 0;
    if (palabras.some((p) => p.startsWith(q))) return 1;
    if (n.includes(q)) return 2;
    return null;
  };

  const coincidencias = opciones
    .map((nombre) => ({ nombre, p: puntaje(nombre) }))
    .filter((x): x is { nombre: string; p: number } => x.p !== null)
    .sort((a, b) => a.p - b.p || a.nombre.localeCompare(b.nombre, 'es'))
    .map((x) => x.nombre);
  if (coincidencias.length > 0) return coincidencias.slice(0, maximo);

  // Escribió mal: buscamos por la primera letra y por parecido
  const parecido = (nombre: string) =>
    Math.min(
      ...normalizar(nombre)
        .split(/\s+/)
        .map((palabra) => distancia(q, palabra.slice(0, Math.max(q.length, 1)))),
    );
  return opciones
    .filter((nombre) =>
      normalizar(nombre)
        .split(/\s+/)
        .some((palabra) => palabra[0] === q[0]),
    )
    .sort((a, b) => parecido(a) - parecido(b))
    .slice(0, maximo);
}

export function BuscadorMediosPago({
  disponibles,
  elegidos,
  onCambiar,
}: {
  disponibles: string[];
  elegidos: string[];
  onCambiar: (lista: string[]) => void;
}) {
  const idCampo = useId();
  const [texto, setTexto] = useState('');
  const [abierto, setAbierto] = useState(false);
  const [resaltado, setResaltado] = useState(0);

  const sinElegir = useMemo(() => disponibles.filter((d) => !elegidos.includes(d)), [disponibles, elegidos]);
  const sugerencias = useMemo(() => buscarParecidos(texto, sinElegir), [texto, sinElegir]);
  const coincideExacto = sugerencias.some((s) => normalizar(s).includes(normalizar(texto)));

  const elegir = (nombre: string) => {
    onCambiar([...elegidos, nombre]);
    setTexto('');
    setAbierto(false);
    setResaltado(0);
  };

  const quitar = (nombre: string) => onCambiar(elegidos.filter((e) => e !== nombre));

  const alApretarTecla = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!sugerencias.length) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setAbierto(true);
      setResaltado((r) => (r + 1) % sugerencias.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setResaltado((r) => (r - 1 + sugerencias.length) % sugerencias.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      elegir(sugerencias[resaltado]);
    } else if (e.key === 'Escape') {
      setAbierto(false);
    }
  };

  const mostrarLista = abierto && texto.trim().length > 0;

  return (
    <div className="mb-4">
      <label htmlFor={idCampo} className="mb-1 block text-sm font-semibold text-slate-700">
        ¿Con qué pagás?
      </label>

      <div className="relative">
        <input
          id={idCampo}
          type="text"
          role="combobox"
          aria-expanded={mostrarLista}
          aria-controls={`${idCampo}-lista`}
          aria-autocomplete="list"
          autoComplete="off"
          placeholder="Escribí tu banco o billetera (ej: Galicia, Mercado Pago)"
          value={texto}
          onChange={(e) => {
            setTexto(e.target.value);
            setAbierto(true);
            setResaltado(0);
          }}
          onFocus={() => setAbierto(true)}
          onBlur={() => setTimeout(() => setAbierto(false), 150)}
          onKeyDown={alApretarTecla}
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-primary-500"
        />

        {mostrarLista && (
          <ul
            id={`${idCampo}-lista`}
            role="listbox"
            className="absolute z-20 mt-1 w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg"
          >
            {sugerencias.length === 0 ? (
              <li className="px-4 py-3 text-sm text-slate-500">No encontramos promos para ese banco.</li>
            ) : (
              <>
                {!coincideExacto && (
                  <li className="px-4 pt-2 text-[11px] text-slate-400">¿Quisiste decir…?</li>
                )}
                {sugerencias.map((nombre, i) => (
                  <li
                    key={nombre}
                    role="option"
                    aria-selected={i === resaltado}
                    onMouseDown={(e) => {
                      e.preventDefault(); // que el clic gane al cierre por onBlur
                      elegir(nombre);
                    }}
                    onMouseEnter={() => setResaltado(i)}
                    className={`cursor-pointer px-4 py-2.5 text-sm ${
                      i === resaltado ? 'bg-slate-100 text-slate-900' : 'text-slate-700'
                    }`}
                  >
                    {nombre}
                  </li>
                ))}
              </>
            )}
          </ul>
        )}
      </div>

      {elegidos.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {elegidos.map((nombre) => (
            <span
              key={nombre}
              className="flex items-center gap-1 rounded-full bg-primary-500 py-1 pl-3 pr-1 text-xs font-bold text-white"
            >
              {nombre}
              <button
                type="button"
                onClick={() => quitar(nombre)}
                aria-label={`Quitar ${nombre}`}
                className="flex h-5 w-5 items-center justify-center rounded-full hover:bg-white/20"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}