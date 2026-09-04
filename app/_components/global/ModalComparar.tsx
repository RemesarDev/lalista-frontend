'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { ShoppingBagIcon, XIcon } from '@phosphor-icons/react/dist/ssr';
import { useComparar, type ProductoComparado } from '@/app/_hooks/useComparar';
import { formatearNombre, formatearPrecio } from '@/app/_lib/utils/formatters';

/**
 * Comparacion lado a lado de dos productos.
 *
 * Se monta una sola vez en el layout de (main) y se controla por la URL
 * (?comparar=EAN_A,EAN_B), igual que la ficha.
 */
export function ModalComparar() {
  const { productos, cargando, error, comparando, limpiar } = useComparar();

  useEffect(() => {
    if (!comparando) return;

    const alPresionar = (e: KeyboardEvent) => {
      if (e.key === 'Escape') limpiar();
    };
    document.addEventListener('keydown', alPresionar);

    const overflowPrevio = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', alPresionar);
      document.body.style.overflow = overflowPrevio;
    };
  }, [comparando, limpiar]);

  if (!comparando) return null;

  const [a, b] = productos;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 backdrop-blur-sm sm:items-center"
      onClick={limpiar}
      role="dialog"
      aria-modal="true"
      aria-label="Comparar productos"
    >
      <div
        className="max-h-[88vh] w-full overflow-y-auto rounded-t-2xl bg-white p-4 shadow-xl sm:max-w-2xl sm:rounded-2xl sm:p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <h2 className="font-display text-sm font-black uppercase tracking-wide text-slate-400">
            Comparar productos
          </h2>
          <button
            type="button"
            onClick={limpiar}
            aria-label="Cerrar"
            className="-mr-1 -mt-1 shrink-0 rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <XIcon size={18} weight="bold" />
          </button>
        </div>

        {cargando && (
          <div className="grid grid-cols-2 gap-3">
            {[0, 1].map((i) => (
              <div key={i} className="flex flex-col gap-2">
                <div className="h-32 animate-pulse rounded-xl bg-slate-100" />
                <div className="h-4 w-3/4 animate-pulse rounded bg-slate-100" />
                <div className="h-4 w-1/2 animate-pulse rounded bg-slate-100" />
              </div>
            ))}
          </div>
        )}

        {error && !cargando && (
          <p className="py-8 text-center text-sm text-slate-400">
            No pudimos cargar la comparación. Probá de nuevo en un rato.
          </p>
        )}

        {a && b && !cargando && (
          <>
            {/* Encabezado: los dos productos lado a lado */}
            <div className="grid grid-cols-2 gap-3">
              <Encabezado producto={a} />
              <Encabezado producto={b} />
            </div>

            <dl className="mt-4 divide-y divide-slate-100 border-t border-slate-100">
              <FilaComparada etiqueta="Marca" a={a.detalle.marca} b={b.detalle.marca} />
              <FilaComparada
                etiqueta="Presentación"
                a={a.detalle.presentacion}
                b={b.detalle.presentacion}
              />
              <FilaComparada etiqueta="Categoría" a={a.detalle.categoria} b={b.detalle.categoria} />
              <FilaComparada
                etiqueta="Etiquetas"
                a={a.detalle.etiquetas.map((e) => e.nombre).join(', ') || null}
                b={b.detalle.etiquetas.map((e) => e.nombre).join(', ') || null}
              />
            </dl>

            <Precios a={a} b={b} />
          </>
        )}
      </div>
    </div>
  );
}

function Encabezado({ producto }: { producto: ProductoComparado }) {
  const [errorImagen, setErrorImagen] = useState(false);
  const mostrarImagen = producto.detalle.url_imagen && !errorImagen;

  return (
    <div className="flex flex-col">
      <div className="relative mb-2 flex h-28 w-full items-center justify-center overflow-hidden rounded-xl bg-slate-50">
        {mostrarImagen ? (
          <Image
            src={producto.detalle.url_imagen!}
            alt={producto.detalle.nombre}
            fill
            sizes="200px"
            className="object-contain p-2"
            onError={() => setErrorImagen(true)}
          />
        ) : (
          <ShoppingBagIcon size={24} weight="thin" className="text-slate-300" />
        )}
      </div>
      <h3 className="font-display text-sm font-black leading-tight text-slate-900">
        {formatearNombre(producto.detalle.nombre)}
      </h3>
    </div>
  );
}

interface FilaProps {
  etiqueta: string;
  a: string | null;
  b: string | null;
}

function FilaComparada({ etiqueta, a, b }: FilaProps) {
  // Si ninguno de los dos tiene el dato, la fila no aporta nada.
  if (!a && !b) return null;

  return (
    <div className="py-2.5">
      <dt className="mb-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">
        {etiqueta}
      </dt>
      <dd className="grid grid-cols-2 gap-3 text-sm text-slate-800">
        <span>{a ?? <span className="text-slate-300">—</span>}</span>
        <span>{b ?? <span className="text-slate-300">—</span>}</span>
      </dd>
    </div>
  );
}

function Precios({ a, b }: { a: ProductoComparado; b: ProductoComparado }) {
  const sinPrecios = a.sucursales.length === 0 && b.sucursales.length === 0;

  if (sinPrecios) {
    return (
      <p className="mt-4 rounded-xl bg-slate-50 px-4 py-3 text-center text-xs text-slate-400">
        Poné tu ubicación para ver y comparar los precios de cada comercio.
      </p>
    );
  }

  // Se listan TODOS los comercios donde este alguno de los dos, no solo donde
  // esten ambos. Saber que un producto no se consigue en cierto super tambien
  // es informacion util, y ocultarlo dejaba la comparacion casi vacia.
  //
  // Primero los comercios donde estan los dos (que son los que sirven para
  // comparar), y despues el resto.
  const todas = [...a.sucursales.map((s) => s.cadena), ...b.sucursales.map((s) => s.cadena)];
  const unicos = Array.from(new Set(todas)).sort((x, y) => {
    const xCompleto = a.sucursales.some((s) => s.cadena === x) && b.sucursales.some((s) => s.cadena === x);
    const yCompleto = a.sucursales.some((s) => s.cadena === y) && b.sucursales.some((s) => s.cadena === y);
    if (xCompleto !== yCompleto) return xCompleto ? -1 : 1;
    return x.localeCompare(y, 'es');
  });

  return (
    <div className="mt-4">
      <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
        Precios por comercio
      </p>

      {unicos.length === 0 ? (
        <p className="rounded-xl bg-slate-50 px-4 py-3 text-center text-xs text-slate-400">
          Ninguno de los dos productos tiene precios en los comercios cercanos.
        </p>
      ) : (
        <div className="divide-y divide-slate-100 border-t border-slate-100">
          {unicos.map((cadena) => {
            const pa = a.sucursales.find((s) => s.cadena === cadena)?.precio ?? null;
            const pb = b.sucursales.find((s) => s.cadena === cadena)?.precio ?? null;

            // El mas barato se resalta. Empate: ninguno.
            const aGana = pa !== null && pb !== null && pa < pb;
            const bGana = pa !== null && pb !== null && pb < pa;

            return (
              <div key={cadena} className="py-2.5">
                <p className="mb-1 text-xs font-bold text-slate-500">{cadena}</p>
                <div className="grid grid-cols-2 gap-3">
                  <Precio valor={pa} destacado={aGana} />
                  <Precio valor={pb} destacado={bGana} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      <p className="mt-3 text-[11px] leading-relaxed text-slate-400">
        Los precios son los del último dato publicado por el SEPA. Si los envases
        tienen distinto contenido, mirá la presentación antes de comparar.
      </p>
    </div>
  );
}

function Precio({ valor, destacado }: { valor: number | null; destacado: boolean }) {
  // Sin precio significa que ese comercio no vende ese producto, no que falte
  // el dato. Se aclara para que el guion no se lea como un error.
  if (valor === null) {
    return <span className="text-xs text-slate-300">No disponible</span>;
  }

  return (
    <span
      className={`text-sm font-bold ${destacado ? 'text-accent-600' : 'text-slate-800'}`}
    >
      ${formatearPrecio(valor)}
      {destacado && <span className="ml-1 text-[10px] font-normal">más barato</span>}
    </span>
  );
}
