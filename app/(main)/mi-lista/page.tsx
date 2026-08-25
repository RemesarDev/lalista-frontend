'use client';

import { Suspense, useState, useEffect } from 'react';
import { MagnifyingGlassIcon, ScalesIcon, ShoppingCartIcon, FloppyDiskIcon } from '@phosphor-icons/react/dist/ssr';
import { DesktopActionButton } from '@/app/_components/global/DesktopActionButton';
import { useListaStore } from '@/app/_store/store';
import { ListItem } from './_components/ListItem';
import BaseContainer from '@/app/_components/global/BaseContainer';
import { ModalGuardarLista } from './_components/ModalGuardarLista';

function ListaProductos() {
  const lista = useListaStore((state) => state.lista);
  const actualizarCantidad = useListaStore((state) => state.actualizarCantidad);
  const eliminarProducto = useListaStore((state) => state.eliminarProducto);
  const toggleComprado = useListaStore((state) => state.toggleComprado);

  if (!lista.length) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-10 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-50 text-slate-400">
          <ShoppingCartIcon size={22} weight="light" />
        </div>
        <h3 className="mt-4 text-sm font-bold text-slate-900">Tu lista está vacía</h3>
        <p className="mt-1 mb-5 text-xs text-slate-400">Buscá productos y agregalos para empezar a ahorrar.</p>
        <DesktopActionButton
          href="/buscar"
          label="Buscar productos"
          icon={<MagnifyingGlassIcon weight="bold" />}
          color="lila"
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {lista.map((producto) => (
        <ListItem
          key={producto.id}
          producto={producto}
          onIncrementar={(id) => {
            const actual = lista.find((item) => item.id === id);
            if (actual) actualizarCantidad(id, actual.cantidad + 1);
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
          onToggleComprado={toggleComprado}
        />
      ))}
    </div>
  );
}

export default function MiListaPage() {
  const totalEnLista = useListaStore((state) => state.lista.length);
  const lista = useListaStore((state) => state.lista);
  const limpiarLista = useListaStore((state) => state.limpiarLista);
  const user = useListaStore((state) => state.user);
  const checkAuth = useListaStore((state) => state.checkAuth);
  const isListaVacia = totalEnLista === 0;

  const [modalGuardarOpen, setModalGuardarOpen] = useState(false);
  const [loadingGuardar, setLoadingGuardar] = useState(false);

  useEffect(() => {
    checkAuth(); // solo sincroniza, no redirige
  }, []);

  const handleLimpiarLista = () => {
    if (isListaVacia) return;
    const confirmar = window.confirm('¿Querés vaciar toda la lista? Esta acción no se puede deshacer.');
    if (confirmar) limpiarLista();
  };

  const handleGuardarLista = async (nombre: string) => {
    setLoadingGuardar(true);
    try {
      const items = lista.map((p) => ({
        id_producto: p.id,
        cantidad: p.cantidad,
        is_checked: p.comprado ?? false,
      }));

      const res = await fetch('/api/listas', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, items }),
      });

      if (!res.ok) throw new Error('Error al guardar la lista');
      setModalGuardarOpen(false);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingGuardar(false);
    }
  };

  return (
    <BaseContainer>
      <div className="mb-6 flex flex-row items-center justify-between gap-4 px-1 w-full border-b border-slate-50 pb-3">

        <div className="flex flex-col">
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Mi lista
          </h1>
          <p className="text-[11px] sm:text-xs font-medium text-slate-400 mt-0.5">
            {totalEnLista === 0
              ? 'Sin productos guardados'
              : `${totalEnLista} producto${totalEnLista === 1 ? '' : 's'} listo${totalEnLista === 1 ? '' : 's'} para comparar`
            }
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">

          <DesktopActionButton
            href="/comparativa"
            label="Conocé el mejor precio"
            icon={<ScalesIcon weight="bold" />}
            disabled={isListaVacia}
            className="hidden md:inline-flex"
          />

          <DesktopActionButton
            href="/buscar"
            label="Agregá productos"
            icon={<MagnifyingGlassIcon weight="bold" />}
            color="naranja"
            variant="solid"
            className="hidden md:inline-flex"
          />

          {user && !isListaVacia && (
            <DesktopActionButton
              onClick={() => setModalGuardarOpen(true)}
              label="Guardar lista"
              icon={<FloppyDiskIcon weight="bold" />}
              color="lila"
              variant="solid"
              className="inline-flex"
            />
          )}

          <DesktopActionButton
            onClick={handleLimpiarLista}
            label="Vaciar lista"
            icon={<ShoppingCartIcon weight="bold" />}
            color="rojo"
            variant="outline"
            disabled={isListaVacia}
            className="inline-flex"
          />

        </div>
      </div>

      <Suspense fallback={<p className="text-center text-sm text-slate-400 py-4">Cargando tus productos...</p>}>
        <ListaProductos />
      </Suspense>

      <ModalGuardarLista
        isOpen={modalGuardarOpen}
        onClose={() => setModalGuardarOpen(false)}
        onConfirm={handleGuardarLista}
        loading={loadingGuardar}
      />
    </BaseContainer>
  );
}