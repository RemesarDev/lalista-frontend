'use client';

import Image from 'next/image';
import { useState } from 'react';
import { CheckIcon, MinusIcon, PlusIcon, ShoppingBagIcon, TrashIcon } from '@phosphor-icons/react/dist/ssr';
import type { ProductoLista } from '@/app/_store/store';

interface ListItemProps {
  producto: ProductoLista;
  onIncrementar: (id: string) => void;
  onDecrementar: (id: string) => void;
  onEliminar: (id: string) => void;
}

export function ListItem({ producto, onIncrementar, onDecrementar, onEliminar }: ListItemProps) {
  const [completado, setCompletado] = useState(false);
  const [errorImagen, setErrorImagen] = useState(false);

  const mostrarImagen = Boolean(producto.url_imagen) && !errorImagen;

  return (
    <article className="w-full border-b border-slate-100 py-3 transition hover:bg-slate-50/50 group last:border-0">
      {/* items-center alinea todos los elementos clave sobre el centro del renglón */}
      <div className="flex items-center gap-2 sm:gap-4 w-full">
        
        {/* 1. Checkbox */}
        <button
          type="button"
          onClick={() => setCompletado((estado) => !estado)}
          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition ${
            completado ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-slate-300 bg-white text-transparent'
          }`}
          aria-pressed={completado}
          aria-label={completado ? 'Marcar como no comprado' : 'Marcar como comprado'}
        >
          <CheckIcon weight="bold" size={12} />
        </button>

        {/* 2. Imagen del producto (Un toque más compacta en mobile para ganar espacio) */}
        <div className="relative h-12 w-12 sm:h-14 sm:w-14 shrink-0 overflow-hidden rounded-xl bg-slate-50 border border-slate-100">
          {mostrarImagen ? (
            <Image
              src={producto.url_imagen!}
              alt={producto.nombre}
              fill
              sizes="(max-w-640px) 48px, 56px"
              className="object-contain p-1"
              onError={() => setErrorImagen(true)}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-slate-300">
              <ShoppingBagIcon size={18} weight="thin" />
            </div>
          )}
        </div>

        {/* 3. Información y controles: Forzamos la misma altura que la imagen (h-12 en mobile) */}
        <div className="flex flex-col justify-between h-12 sm:h-14 min-w-0 flex-1 px-1">
          {/* Nombre arriba (TOP) -> min-w-0 y truncate impiden que empuje al botón de eliminar */}
          <h3 className={`text-xs sm:text-sm font-bold text-slate-900 truncate ${completado ? 'line-through opacity-40' : ''}`}>
            {producto.nombre}
          </h3>

          {/* Selector de cantidad abajo (BOTTOM) */}
          <div className="flex items-center gap-1.5 self-start">
            <button
              type="button"
              onClick={() => onDecrementar(producto.id)}
              className="inline-flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-md bg-slate-100 text-slate-600 transition hover:bg-slate-200 active:scale-95"
              aria-label="Restar cantidad"
            >
              <MinusIcon weight="bold" size={10} />
            </button>

            <span className="min-w-5 text-center text-xs font-bold text-slate-800">
              {producto.cantidad}
            </span>

            <button
              type="button"
              onClick={() => onIncrementar(producto.id)}
              className="inline-flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-md bg-primary-400 text-white transition hover:bg-primary-500 active:scale-95"
              aria-label="Sumar cantidad"
            >
              <PlusIcon weight="bold" size={10} />
            </button>
          </div>
        </div>

        {/* 4. Botón Eliminar (Fijo a la derecha, alineado verticalmente) */}
        <button
          type="button"
          onClick={() => onEliminar(producto.id)}
          className="inline-flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 transition hover:border-red-200 hover:text-red-500"
          aria-label="Eliminar producto"
        >
          <TrashIcon weight="bold" size={14} />
        </button>

      </div>
    </article>
  );
}