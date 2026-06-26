'use client';

import Link from 'next/link';
import { Suspense } from 'react';
import { MagnifyingGlassIcon, ScalesIcon, ShoppingCartIcon } from '@phosphor-icons/react/dist/ssr';
import { DesktopActionButton } from '@/app/_components/global/DesktopActionButton';
import { useListaStore } from '@/app/_store/store';
import { ListItem } from './_components/ListItem';

function ListaProductos() {
  const lista = useListaStore((state) => state.lista);
  const actualizarCantidad = useListaStore((state) => state.actualizarCantidad);
  const eliminarProducto = useListaStore((state) => state.eliminarProducto);
  const limpiarLista = useListaStore((state) => state.limpiarLista);

  const handleLimpiarLista = () => {
    limpiarLista();
  };

  if (!lista.length) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-8 text-center shadow-xs">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary-50 text-primary-500">
          <ShoppingCartIcon size={22} weight="bold" />
        </div>
        <h3 className="mt-4 text-base font-bold text-slate-900">Tu lista está vacía</h3>
        <p className="mt-1 text-sm text-slate-500">Buscá productos y agregalos para verlos acá.</p>

        <div className="mt-5 flex flex-col gap-2 md:hidden">
          <Link href="/buscar" className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary-400 px-4 py-3 text-sm font-semibold text-white transition hover:bg-primary-500">
            <MagnifyingGlassIcon weight="bold" />
            Agregar más productos
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {lista.map((producto) => (
        <ListItem
          key={producto.id}
          producto={producto}
          onIncrementar={(id) => {
            const actual = lista.find((item) => item.id === id);
            if (actual) {
              actualizarCantidad(id, actual.cantidad + 1);
            }
          }}
          onDecrementar={(id) => {
            const actual = lista.find((item) => item.id === id);
            if (!actual) return;

            if (actual.cantidad <= 1) {
              eliminarProducto(id);
              return;
            }

            actualizarCantidad(id, actual.cantidad - 1);
          }}
          onEliminar={eliminarProducto}
        />
      ))}
    </div>
  );
}

export default function MiListaPage() {
  const totalEnLista = useListaStore((state) => state.lista.length);
  const limpiarLista = useListaStore((state) => state.limpiarLista);

  const handleLimpiarLista = () => {
    const confirmar = window.confirm('¿Querés vaciar toda la lista? Esta acción no se puede deshacer.');

    if (confirmar) {
      limpiarLista();
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-16">
      <main className="mx-auto mt-4 max-w-screen-xl px-2">
        <div className="mb-3 flex flex-col gap-3 px-1 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-sm font-bold font-display uppercase tracking-wider text-slate-400">Mi lista</h2>
            <p className="mt-1 text-xs text-slate-500">{totalEnLista} producto{totalEnLista === 1 ? '' : 's'} guardado{totalEnLista === 1 ? '' : 's'}</p>
          </div>

          <div className="flex items-center gap-2">
            <DesktopActionButton
              href="/comparativa"
              label="Buscar mejor precio"
              icon={<ScalesIcon weight="bold" />}
            />

            <button
              type="button"
              onClick={handleLimpiarLista}
              className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50"
            >
              <ShoppingCartIcon weight="bold" />
              Limpiar lista
            </button>
          </div>
        </div>

        <Suspense fallback={<p className="text-center text-sm text-slate-400">Cargando lista...</p>}>
          <ListaProductos />
        </Suspense>
      </main>
    </div>
  );
}