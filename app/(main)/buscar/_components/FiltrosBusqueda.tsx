'use client';

import { XIcon } from '@phosphor-icons/react/dist/ssr';
import { useCategorias } from '@/app/_hooks/useCategorias';
import { useFiltrosDiferidos } from '../_hooks/useFiltrosDiferidos';

// Debajo de este numero un filtro deja la pantalla casi vacia y frustra mas de
// lo que ayuda. Con el catalogo actual quedan afuera Organico (31),
// Sin alcohol (24), Vegetariano (13) y Apto diabeticos (0).
//
// El conteo se usa para decidir que filtros ofrecer, pero no se muestra: es
// del catalogo nacional y los resultados estan acotados a la zona del usuario,
// asi que ver "Bajas calorias 550" y recibir 3 productos confunde mas de lo
// que informa.
const MINIMO_PRODUCTOS = 50;

/**
 * Chips de categoria y etiquetas. Van dentro de la franja fija del buscador
 * (StickySearch), asi se pueden tocar sin volver arriba de todo.
 *
 * Por eso son una sola fila: en el celular se desliza de costado en lugar de
 * partirse en varias lineas, para que la franja fija no se coma la pantalla.
 * En escritorio sobra lugar y se acomodan en varias lineas.
 */
export function FiltrosBusqueda() {
  const { rubros, etiquetas: disponibles } = useCategorias();
  // Se muestran los filtros marcados, aunque todavia esten esperando para
  // aplicarse: el usuario ve su toque al instante.
  const {
    visibles: { categoria, etiquetas },
    aplicando,
    quitarCategoria: onQuitarCategoria,
    alternarEtiqueta: onToggleEtiqueta,
  } = useFiltrosDiferidos();

  const todas = rubros.flatMap((rubro) => [rubro, ...rubro.categorias]);
  const nombreCategoria = todas.find((c) => c.slug === categoria)?.nombre ?? categoria;

  // Se muestran las que tienen volumen, mas cualquiera que el usuario ya tenga
  // activa (por ejemplo si llego con un link compartido).
  const visibles = disponibles.filter(
    (e) => e.productos >= MINIMO_PRODUCTOS || etiquetas.includes(e.codigo)
  );

  if (!categoria && visibles.length === 0) return null;

  return (
    <>
      {/* Aviso discreto mientras corre la espera: lo elegido ya se ve marcado
          pero los resultados todavia son los anteriores. Es una linea al pie
          de la franja fija (no texto que entra y sale) para que la franja no
          cambie de alto mientras el usuario toca chips. */}
      {aplicando && (
        <span
          role="status"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-0.5 animate-pulse bg-accent-600"
        >
          <span className="sr-only">Aplicando filtros…</span>
        </span>
      )}

      {/* Los margenes negativos son los mismos que el relleno de StickySearch:
          la fila se desliza de borde a borde de la pantalla. */}
      <div className="-mx-6 flex items-center gap-1.5 overflow-x-auto px-6 pb-0.5 [scrollbar-width:none] sm:-mx-8 sm:px-8 md:mx-0 md:flex-wrap md:justify-center md:overflow-visible md:px-0 [&::-webkit-scrollbar]:hidden">
        {categoria && (
          <>
            <span className="shrink-0 font-display text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Categoría
            </span>
            <button
              type="button"
              onClick={onQuitarCategoria}
              aria-label={`Quitar la categoría ${nombreCategoria}`}
              className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full bg-primary-500 px-3 py-1 font-display text-xs font-bold text-white transition hover:bg-orange-600"
            >
              {nombreCategoria}
              <XIcon size={12} weight="bold" />
            </button>
          </>
        )}

        {visibles.length > 0 && (
          <>
            <span
              className={`shrink-0 whitespace-nowrap font-display text-[10px] font-bold uppercase tracking-widest text-slate-400 ${
                categoria ? 'ml-2' : ''
              }`}
            >
              Según la etiqueta
            </span>

            {visibles.map((etiqueta) => {
              const activa = etiquetas.includes(etiqueta.codigo);
              return (
                <button
                  key={etiqueta.codigo}
                  type="button"
                  onClick={() => onToggleEtiqueta(etiqueta.codigo)}
                  aria-pressed={activa}
                  className={`shrink-0 whitespace-nowrap rounded-full border px-2.5 py-1 text-[11px] font-bold transition active:scale-95 ${
                    activa
                      ? 'border-accent-600 bg-accent-600 text-white'
                      : 'border-accent-300 bg-white text-slate-500 hover:border-slate-400'
                  }`}
                >
                  {etiqueta.nombre}
                </button>
              );
            })}
          </>
        )}
      </div>
    </>
  );
}

/**
 * Aclaracion sobre las etiquetas activas. Queda al principio de los
 * resultados y no en la franja fija: se lee una vez, no hace falta tenerla
 * siempre a la vista.
 */
export function NotaFiltros() {
  const {
    visibles: { etiquetas },
  } = useFiltrosDiferidos();

  if (etiquetas.length === 0) return null;

  return (
    <p className="text-[11px] leading-relaxed text-slate-400">
      {etiquetas.length > 1 && (
        <>
          Se muestran los productos que cumplen{' '}
          <strong className="text-slate-500">todos</strong> los filtros, así que
          combinar varios reduce mucho los resultados.{' '}
        </>
      )}
      Los datos vienen de la descripción del fabricante: verificá siempre la etiqueta.
    </p>
  );
}
