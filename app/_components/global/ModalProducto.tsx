'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { ShoppingBagIcon, XIcon } from '@phosphor-icons/react/dist/ssr';
import { useDetalleProducto } from '@/app/_hooks/useDetalleProducto';
import { formatearNombre } from '@/app/_lib/utils/formatters';

/**
 * Ficha del producto, en modal sobre la vista actual.
 *
 * Se controla por la URL (?producto=EAN) en vez de por un estado global:
 * asi cualquier vista puede abrirla sin conocer al modal, el boton "atras"
 * del navegador lo cierra, y el link se puede compartir.
 *
 * Se monta una sola vez, en el layout de (main).
 */
export function ModalProducto() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const idProducto = searchParams.get('producto');
  const { producto, cargando, error } = useDetalleProducto(idProducto);

  const [errorImagen, setErrorImagen] = useState(false);

  const cerrar = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('producto');
    const query = params.toString();
    router.replace(query ? `?${query}` : window.location.pathname, { scroll: false });
  };

  // Cerrar con Escape y bloquear el scroll del fondo mientras esta abierto.
  useEffect(() => {
    if (!idProducto) return;

    const alPresionar = (e: KeyboardEvent) => {
      if (e.key === 'Escape') cerrar();
    };
    document.addEventListener('keydown', alPresionar);

    const overflowPrevio = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', alPresionar);
      document.body.style.overflow = overflowPrevio;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idProducto]);

  // Cada producto nuevo arranca sin error de imagen.
  useEffect(() => {
    setErrorImagen(false);
  }, [idProducto]);

  if (!idProducto) return null;

  const mostrarImagen = producto?.url_imagen && !errorImagen;

  // El contenido sale de v_producto_contenido, que combina las columnas del
  // SEPA con lo extraido de la descripcion: el 72% del catalogo llega como
  // "1 UNI" aunque el paquete diga 500 g en el nombre.
  //
  // Si no se pudo determinar, la fila no se muestra: "1 UNI" no informa nada.
  const presentacion = producto?.presentacion ?? null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 backdrop-blur-sm sm:items-center"
      onClick={cerrar}
      role="dialog"
      aria-modal="true"
      aria-label="Detalle del producto"
    >
      <div
        className="max-h-[85vh] w-full overflow-y-auto rounded-t-2xl bg-white p-5 shadow-xl sm:max-w-md sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-start justify-between gap-3">
          <h2 className="font-display text-sm font-black uppercase tracking-wide text-slate-400">
            Detalle del producto
          </h2>
          <button
            type="button"
            onClick={cerrar}
            aria-label="Cerrar"
            className="-mr-1 -mt-1 shrink-0 rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <XIcon size={18} weight="bold" />
          </button>
        </div>

        {cargando && (
          <div className="flex flex-col gap-3 py-4">
            <div className="h-40 animate-pulse rounded-xl bg-slate-100" />
            <div className="h-4 w-3/4 animate-pulse rounded bg-slate-100" />
            <div className="h-4 w-1/2 animate-pulse rounded bg-slate-100" />
          </div>
        )}

        {error && !cargando && (
          <p className="py-8 text-center text-sm text-slate-400">
            No pudimos cargar este producto. Probá de nuevo en un rato.
          </p>
        )}

        {producto && !cargando && (
          <>
            <div className="relative mb-4 flex h-44 w-full items-center justify-center overflow-hidden rounded-xl bg-slate-50">
              {mostrarImagen ? (
                <Image
                  src={producto.url_imagen!}
                  alt={producto.nombre}
                  fill
                  sizes="(max-width: 640px) 100vw, 400px"
                  className="object-contain p-4"
                  onError={() => setErrorImagen(true)}
                />
              ) : (
                <div className="flex flex-col items-center gap-2 px-6 text-slate-400">
                  <ShoppingBagIcon size={32} weight="thin" />
                  <span className="text-center text-[11px] leading-tight">
                    Sin imagen disponible
                  </span>
                </div>
              )}
            </div>

            <h3 className="font-display text-lg font-black leading-tight text-slate-900">
              {formatearNombre(producto.nombre)}
            </h3>

            {producto.etiquetas.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {producto.etiquetas.map((e) => (
                  <span
                    key={e.codigo}
                    className="rounded-full bg-accent-600 px-2.5 py-1 font-display text-[11px] font-bold text-white"
                  >
                    {e.nombre}
                  </span>
                ))}
              </div>
            )}

            <dl className="mt-4 divide-y divide-slate-100 border-t border-slate-100">
              <Fila etiqueta="Marca" valor={producto.marca} />
              <Fila etiqueta="Presentación" valor={presentacion} />
              <Fila
                etiqueta="Categoría"
                valor={producto.categoria}
                href={
                  producto.categoria_slug
                    ? `/buscar?categoria=${encodeURIComponent(producto.categoria_slug)}`
                    : undefined
                }
                onNavegar={cerrar}
              />
              <Fila etiqueta="Rubro" valor={producto.rubro} />
              <Fila etiqueta="Código de barras" valor={producto.id_producto} mono />
            </dl>

            {producto.etiquetas.length > 0 && (
              <p className="mt-4 text-[11px] leading-relaxed text-slate-400">
                Los datos vienen de la descripción del fabricante: verificá siempre el envase.
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}

interface FilaProps {
  etiqueta: string;
  valor: string | null;
  href?: string;
  onNavegar?: () => void;
  mono?: boolean;
}

function Fila({ etiqueta, valor, href, onNavegar, mono }: FilaProps) {
  // Sin dato no se muestra la fila: una ficha con "Marca: —" no aporta.
  if (!valor) return null;

  const contenido = (
    <span className={`text-right text-sm text-slate-800 ${mono ? 'font-mono text-xs' : ''}`}>
      {valor}
    </span>
  );

  return (
    <div className="flex items-baseline justify-between gap-4 py-2.5">
      <dt className="shrink-0 text-xs font-bold uppercase tracking-wide text-slate-400">
        {etiqueta}
      </dt>
      <dd className="min-w-0">
        {href ? (
          <Link href={href} onClick={onNavegar} className="text-right text-sm font-bold text-primary-500 hover:underline">
            {valor}
          </Link>
        ) : (
          contenido
        )}
      </dd>
    </div>
  );
}
