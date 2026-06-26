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
    <article className={`rounded-2xl border bg-white p-3 shadow-xs transition ${completado ? 'border-emerald-200 bg-emerald-50/40' : 'border-slate-200/70'}`}>
      <div className="flex items-start gap-3">
        <button
          type="button"
          onClick={() => setCompletado((estado) => !estado)}
          className={`mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition ${completado ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-slate-300 bg-white text-transparent'}`}
          aria-pressed={completado}
          aria-label={completado ? 'Marcar como no comprado' : 'Marcar como comprado'}
        >
          <CheckIcon weight="bold" size={12} />
        </button>

        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-slate-100">
          {mostrarImagen ? (
            <Image
              src={producto.url_imagen!}
              alt={producto.nombre}
              fill
              sizes="64px"
              className="object-contain p-1.5"
              onError={() => setErrorImagen(true)}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-slate-400">
              <ShoppingBagIcon size={22} weight="thin" />
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className={`truncate text-sm font-bold text-slate-900 ${completado ? 'line-through opacity-70' : ''}`}>
                {producto.nombre}
              </h3>
            </div>

            <button
              type="button"
              onClick={() => onEliminar(producto.id)}
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:border-red-200 hover:text-red-500"
              aria-label="Eliminar producto"
            >
              <TrashIcon weight="bold" size={16} />
            </button>
          </div>

          <div className="mt-3 flex items-center justify-between gap-3 border-t border-slate-100 pt-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onDecrementar(producto.id)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition hover:bg-slate-200"
                aria-label="Restar cantidad"
              >
                <MinusIcon weight="bold" size={15} />
              </button>

              <span className="min-w-8 text-center text-sm font-black text-slate-800">
                {producto.cantidad}
              </span>

              <button
                type="button"
                onClick={() => onIncrementar(producto.id)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-primary-400 text-white transition hover:bg-primary-500"
                aria-label="Sumar cantidad"
              >
                <PlusIcon weight="bold" size={15} />
              </button>
            </div>

            <span className={`text-[10px] font-semibold uppercase tracking-wide ${completado ? 'text-emerald-600' : 'text-slate-400'}`}>
              {completado ? 'Comprado' : 'Pendiente'}
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}
