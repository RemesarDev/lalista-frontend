'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CaretDownIcon, ListIcon, XIcon } from '@phosphor-icons/react/dist/ssr';
import { useCategorias } from '@/app/_hooks/useCategorias';

interface MenuCategoriasProps {
  /** Slug activo, para resaltarlo en el listado. */
  activo?: string;
}

/**
 * Menu de rubros y categorias. Se abre desde el buscador y lleva a
 * /buscar?categoria=slug.
 *
 * Un rubro puede no tener hijas (Mascotas es el caso): entonces el rubro es
 * el destino directo y no se muestra flecha de desplegar.
 */
export function MenuCategorias({ activo }: MenuCategoriasProps) {
  const { rubros, cargando } = useCategorias();
  const router = useRouter();

  const [abierto, setAbierto] = useState(false);
  const [expandido, setExpandido] = useState<string | null>(null);
  const contenedorRef = useRef<HTMLDivElement>(null);

  // Cerrar al hacer clic afuera o con Escape.
  useEffect(() => {
    if (!abierto) return;

    const alClickear = (e: MouseEvent) => {
      if (contenedorRef.current && !contenedorRef.current.contains(e.target as Node)) {
        setAbierto(false);
      }
    };
    const alPresionar = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setAbierto(false);
    };

    document.addEventListener('mousedown', alClickear);
    document.addEventListener('keydown', alPresionar);
    return () => {
      document.removeEventListener('mousedown', alClickear);
      document.removeEventListener('keydown', alPresionar);
    };
  }, [abierto]);

  const irA = (slug: string) => {
    setAbierto(false);
    router.push(`/buscar?categoria=${encodeURIComponent(slug)}`);
  };

  if (cargando || rubros.length === 0) return null;

  return (
    <div ref={contenedorRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        aria-expanded={abierto}
        aria-haspopup="true"
        aria-label="Ver categorías"
        className="inline-flex h-[42px] items-center gap-1.5 rounded-xl border border-accent-300 bg-white px-3 text-sm font-bold text-slate-600 shadow-sm transition hover:border-primary-400 hover:text-primary-500"
      >
        {abierto ? <XIcon size={18} weight="bold" /> : <ListIcon size={18} weight="bold" />}
        <span className="hidden sm:inline">Categorías</span>
      </button>

      {abierto && (
        <div className="absolute right-0 z-50 mt-2 max-h-[70vh] w-[min(20rem,calc(100vw-2rem))] overflow-y-auto overscroll-contain rounded-2xl border border-slate-200 bg-white p-2 shadow-xl">
          {rubros.map((rubro) => {
            const tieneHijas = rubro.categorias.length > 0;
            const estaExpandido = expandido === rubro.slug;

            return (
              <div key={rubro.slug} className="border-b border-slate-50 last:border-0">
                <div className="flex items-stretch">
                  <button
                    type="button"
                    onClick={() => irA(rubro.slug)}
                    className={`flex-1 rounded-lg px-3 py-2.5 text-left text-sm font-bold transition hover:bg-slate-50 ${
                      activo === rubro.slug ? 'text-primary-500' : 'text-slate-800'
                    }`}
                  >
                    {rubro.nombre}
                  </button>

                  {tieneHijas && (
                    <button
                      type="button"
                      onClick={() => setExpandido(estaExpandido ? null : rubro.slug)}
                      aria-label={`${estaExpandido ? 'Ocultar' : 'Ver'} categorías de ${rubro.nombre}`}
                      aria-expanded={estaExpandido}
                      className="px-3 text-slate-400 transition hover:text-slate-700"
                    >
                      <CaretDownIcon
                        size={14}
                        weight="bold"
                        className={`transition-transform ${estaExpandido ? 'rotate-180' : ''}`}
                      />
                    </button>
                  )}
                </div>

                {tieneHijas && estaExpandido && (
                  <div className="pb-2 pl-3">
                    {rubro.categorias.map((cat) => (
                      <button
                        key={cat.slug}
                        type="button"
                        onClick={() => irA(cat.slug)}
                        className={`block w-full rounded-lg px-3 py-2 text-left text-[13px] transition hover:bg-slate-50 ${
                          activo === cat.slug
                            ? 'font-bold text-primary-500'
                            : 'text-slate-500'
                        }`}
                      >
                        {cat.nombre}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
