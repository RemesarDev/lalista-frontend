'use client';

import Image from 'next/image';
import { ArrowsLeftRightIcon, ShoppingBagIcon, XIcon } from '@phosphor-icons/react/dist/ssr';
import { useComparar } from '@/app/_hooks/useComparar';
import { useDetalleProducto } from '@/app/_hooks/useDetalleProducto';
import { formatearNombre } from '@/app/_lib/utils/formatters';
import { useState } from 'react';

/**
 * Aviso flotante de que hay un producto esperando con quien compararse.
 *
 * Sin esto, tocar "Comparar" cerraba la ficha y no quedaba ninguna señal: el
 * usuario no tenia forma de saber que habia algo pendiente.
 *
 * Se monta en el layout de (main) y aparece solo cuando hay exactamente un
 * producto elegido. Con dos ya se abre la comparacion y este aviso sobra.
 */
export function AvisoComparar() {
  const { ids, esperandoSegundo, limpiar } = useComparar();
  const { producto } = useDetalleProducto(esperandoSegundo ? ids[0] : null);
  const [errorImagen, setErrorImagen] = useState(false);

  if (!esperandoSegundo) return null;

  const mostrarImagen = producto?.url_imagen && !errorImagen;

  return (
    <div
      // bottom-20 en mobile para no taparse con la navegacion inferior, que
      // esta fija en bottom-0. z-40 lo deja por debajo de los modales (z-50).
      className="fixed bottom-20 left-1/2 z-40 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 md:bottom-6"
      // role="status" y aria-live hacen que un lector de pantalla lo anuncie
      // solo, sin que el usuario tenga que ir a buscarlo.
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center gap-3 rounded-2xl border border-accent-300 bg-white px-3 py-2.5 shadow-lg">
        <div className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-50">
          {mostrarImagen ? (
            <Image
              src={producto.url_imagen!}
              alt=""
              fill
              sizes="44px"
              className="object-contain p-1"
              onError={() => setErrorImagen(true)}
            />
          ) : (
            <ShoppingBagIcon size={18} weight="thin" className="text-slate-300" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1 font-display text-[10px] font-bold uppercase tracking-widest text-primary-500">
            <ArrowsLeftRightIcon size={11} weight="bold" />
            Elegiste para comparar
          </p>
          <p className="truncate text-xs font-bold text-slate-800">
            {producto ? formatearNombre(producto.nombre) : 'Cargando…'}
          </p>
          <p className="text-[11px] leading-tight text-slate-400">
            Abrí otro producto y tocá comparar
          </p>
        </div>

        <button
          type="button"
          onClick={limpiar}
          aria-label="Cancelar la comparación"
          className="shrink-0 rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
        >
          <XIcon size={16} weight="bold" />
        </button>
      </div>
    </div>
  );
}
