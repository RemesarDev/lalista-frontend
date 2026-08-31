'use client';

import { XIcon } from '@phosphor-icons/react/dist/ssr';
import { useCategorias } from '@/app/_hooks/useCategorias';

// Debajo de este numero un filtro deja la pantalla casi vacia y frustra mas de
// lo que ayuda. Con el catalogo actual quedan afuera Organico (31),
// Sin alcohol (24), Vegetariano (13) y Apto diabeticos (0).
//
// El conteo se usa para decidir que filtros ofrecer, pero no se muestra: es
// del catalogo nacional y los resultados estan acotados a la zona del usuario,
// asi que ver "Bajas calorias 550" y recibir 3 productos confunde mas de lo
// que informa.
const MINIMO_PRODUCTOS = 50;

interface FiltrosBusquedaProps {
  categoria: string;
  etiquetas: string[];
  onQuitarCategoria: () => void;
  onToggleEtiqueta: (codigo: string) => void;
}

export function FiltrosBusqueda({
  categoria,
  etiquetas,
  onQuitarCategoria,
  onToggleEtiqueta,
}: FiltrosBusquedaProps) {
  const { rubros, etiquetas: disponibles } = useCategorias();

  const todas = rubros.flatMap((rubro) => [rubro, ...rubro.categorias]);
  const nombreCategoria = todas.find((c) => c.slug === categoria)?.nombre ?? categoria;

  // Se muestran las que tienen volumen, mas cualquiera que el usuario ya tenga
  // activa (por ejemplo si llego con un link compartido).
  const visibles = disponibles.filter(
    (e) => e.productos >= MINIMO_PRODUCTOS || etiquetas.includes(e.codigo)
  );

  return (
    <div className="flex flex-col gap-2.5">
      {categoria && (
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
            Categoría
          </span>
          <button
            type="button"
            onClick={onQuitarCategoria}
            className="inline-flex items-center gap-1.5 rounded-full bg-primary-500 px-3 py-1 text-xs font-bold text-white transition hover:bg-orange-600"
          >
            {nombreCategoria}
            <XIcon size={12} weight="bold" />
          </button>
        </div>
      )}

      {visibles.length > 0 && (
        <>
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="mr-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Según el envase
            </span>

            {visibles.map((etiqueta) => {
              const activa = etiquetas.includes(etiqueta.codigo);
              return (
                <button
                  key={etiqueta.codigo}
                  type="button"
                  onClick={() => onToggleEtiqueta(etiqueta.codigo)}
                  aria-pressed={activa}
                  className={`rounded-full border px-2.5 py-1 text-[11px] font-bold transition active:scale-95 ${
                    activa
                      ? 'border-accent-600 bg-accent-600 text-white'
                      : 'border-accent-300 bg-white text-slate-500 hover:border-slate-400'
                  }`}
                >
                  {etiqueta.nombre}
                </button>
              );
            })}
          </div>

          {etiquetas.length > 0 && (
            <p className="text-[11px] leading-relaxed text-slate-400">
              {etiquetas.length > 1 && (
                <>
                  Se muestran los productos que cumplen{' '}
                  <strong className="text-slate-500">todos</strong> los filtros, así que
                  combinar varios reduce mucho los resultados.{' '}
                </>
              )}
              Los datos vienen de la descripción del fabricante: verificá siempre el envase.
            </p>
          )}
        </>
      )}
    </div>
  );
}
