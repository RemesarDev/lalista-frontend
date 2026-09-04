'use client';

import { Suspense, useEffect } from 'react';
import { 
  MagnifyingGlassIcon, 
  ScalesIcon, 
  ShoppingCartIcon, 
  FloppyDiskIcon, 
  XCircleIcon, 
  CheckCircleIcon,
  PlusIcon 
} from '@phosphor-icons/react/dist/ssr';
import Link from 'next/link';
import { DesktopActionButton } from '@/app/_components/global/DesktopActionButton';
import { useListaStore } from '@/app/_store/store';
import BaseContainer from '@/app/_components/global/BaseContainer';
import { ModalGuardarLista } from './_components/ModalGuardarLista';
import { CerrarListaModal } from './_components/CerrarListaModal';
import { GrupoListItem } from './_components/GrupoListItem';
import { useGestionLista } from './_hooks/useGestionLista';

function ListaProductos() {
  const lista = useListaStore((state) => state.lista);
  const actualizarCantidadGrupo = useListaStore((state) => state.actualizarCantidadGrupo);
  const eliminarOpcion = useListaStore((state) => state.eliminarOpcion);
  const eliminarGrupo = useListaStore((state) => state.eliminarGrupo);
  const toggleCompradoGrupo = useListaStore((state) => state.toggleCompradoGrupo);

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
    <div className="flex flex-col gap-3">
      {lista.map((grupo) => (
        <GrupoListItem
          key={grupo.grupoId}
          grupo={grupo}
          onIncrementar={(grupoId) => {
            const actual = lista.find((g) => g.grupoId === grupoId);
            if (actual) actualizarCantidadGrupo(grupoId, actual.cantidad + 1);
          }}
          onDecrementar={(grupoId) => {
            const actual = lista.find((g) => g.grupoId === grupoId);
            if (!actual) return;
            if (actual.cantidad <= 1) {
              eliminarGrupo(grupoId);
              return;
            }
            actualizarCantidadGrupo(grupoId, actual.cantidad - 1);
          }}
          onEliminarOpcion={eliminarOpcion}
          onEliminarGrupo={eliminarGrupo}
          onToggleComprado={toggleCompradoGrupo}
        />
      ))}

      {/* Botón "Agregar producto" al final del listado con el mismo formato que los ítems */}
        <Link
              href="/buscar"
              className="flex items-center justify-center gap-2 rounded-xl border border-orange-200 bg-orange-50/40 p-3 sm:p-4 text-orange-600 transition-all hover:bg-orange-100/50 hover:border-orange-300 shadow-sm"
            >
              <PlusIcon size={18} weight="bold" />
              <span className="text-xs sm:text-sm font-bold">Agregar productos</span>
            </Link>
          </div>
  );
}

export default function MiListaPage() {
  const totalEnLista = useListaStore((state) => state.lista.length);
  const user = useListaStore((state) => state.user);
  const checkAuth = useListaStore((state) => state.checkAuth);
  const listaId = useListaStore((state) => state.listaId);
  const listaRol = useListaStore((state) => state.listaRol);
  const isListaVacia = totalEnLista === 0;

  const {
    modalGuardarOpen,
    modalCerrarOpen,
    loadingGuardar,
    loadingSincronizar,
    sincronizadoOk,
    abrirModalGuardar,
    cerrarModalGuardar,
    abrirModalCerrar,
    cerrarModalCerrar,
    handleGuardarLista,
    handleSincronizar,
    handleCerrarLista,
    handleLimpiarLista,
  } = useGestionLista();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const puedeEditar = !listaId || listaRol === 'owner' || listaRol === 'editor';

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
              : `${totalEnLista} ítem${totalEnLista === 1 ? '' : 's'} listo${totalEnLista === 1 ? '' : 's'} para comparar`
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

          {user && !isListaVacia && puedeEditar && (
            <DesktopActionButton
              onClick={listaId ? handleSincronizar : abrirModalGuardar}
              label={
                loadingSincronizar ? 'Sincronizando...' :
                  sincronizadoOk ? 'Sincronizado' :
                    listaId ? 'Sincronizar' : 'Guardar lista'
              }
              icon={
                sincronizadoOk
                  ? <CheckCircleIcon weight="bold" />
                  : <FloppyDiskIcon weight="bold" />
              }
              color="lila"
              variant="solid"
              className="inline-flex"
            />
          )}

          {listaId && (
            <DesktopActionButton
              onClick={abrirModalCerrar}
              label="Cerrar lista"
              icon={<XCircleIcon weight="bold" />}
              color="rojo"
              variant="outline"
              className="inline-flex"
            />
          )}

          {!listaId && (
            <DesktopActionButton
              onClick={handleLimpiarLista}
              label="Vaciar lista"
              icon={<ShoppingCartIcon weight="bold" />}
              color="rojo"
              variant="outline"
              disabled={isListaVacia}
              className="inline-flex"
            />
          )}
        </div>
      </div>

      <Suspense fallback={<p className="text-center text-sm text-slate-400 py-4">Cargando tus productos...</p>}>
        <ListaProductos />
      </Suspense>

      <ModalGuardarLista
        isOpen={modalGuardarOpen}
        onClose={cerrarModalGuardar}
        onConfirm={handleGuardarLista}
        loading={loadingGuardar}
      />

      <CerrarListaModal
        isOpen={modalCerrarOpen}
        onClose={cerrarModalCerrar}
        onCerrarSinGuardar={() => handleCerrarLista(false)}
        onSincronizarYCerrar={() => handleCerrarLista(true)}
        loading={loadingSincronizar}
      />
    </BaseContainer>
  );
}