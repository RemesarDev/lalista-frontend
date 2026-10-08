// app/(main)/mi-lista/page.tsx
'use client';

import { Suspense, useEffect, useState, useRef } from 'react';
import {
  MagnifyingGlassIcon,
  ScalesIcon,
  ShoppingCartIcon,
  FloppyDiskIcon,
  CircleNotchIcon,
  XCircleIcon,
  CheckCircleIcon,
  PlusIcon,
  PencilSimpleIcon,
  ShareNetworkIcon,
  UsersIcon
} from '@phosphor-icons/react/dist/ssr';
import Link from 'next/link';
import { DesktopActionButton } from '@/app/_components/global/DesktopActionButton';
import { useListaStore } from '@/app/_store/store';
import BaseContainer from '@/app/_components/global/BaseContainer';
import { ModalGuardarLista } from './_components/ModalGuardarLista';
import { CerrarListaModal } from './_components/CerrarListaModal';
import { GrupoListItem } from './_components/GrupoListItem';
import { useGestionLista } from './_hooks/useGestionLista';
import { useQuitarConDeshacer } from './_hooks/useQuitarConDeshacer';
import { CompartirContenidoListaModal } from '../mis-listas/_components/CompartirContenidoListaModal';
import { CompartirListaModal } from '../mis-listas/_components/CompartirListaModal';

// Tipado para el estado del modal de compartir
interface ModalCompartirState {
    isOpen: boolean;
    listaId: string | null;
}

interface ModalCompartirContenidoState {
    isOpen: boolean;
    listaId: string | null;
    listaNombre: string;
}

function ListaProductos({ simplificado }: { simplificado: boolean }) {
  const lista = useListaStore((state) => state.lista);
  const actualizarCantidadGrupo = useListaStore((state) => state.actualizarCantidadGrupo);
  const actualizarCantidadOpcion = useListaStore((state) => state.actualizarCantidadOpcion);
  const actualizarNombreGrupo = useListaStore((state) => state.actualizarNombreGrupo);
  const toggleCompradoGrupo = useListaStore((state) => state.toggleCompradoGrupo);

  const { quitarGrupo, quitarOpcion } = useQuitarConDeshacer();
  const [grupoAbiertoId, setGrupoAbiertoId] = useState<string | null>(null);

  const toggleAbierto = (grupoId: string) => {
    setGrupoAbiertoId((prev) => (prev === grupoId ? null : grupoId));
  };

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
          simplificado={simplificado}
          abierto={grupoAbiertoId === grupo.grupoId}
          onToggleAbierto={toggleAbierto}
          onIncrementar={(grupoId) => {
            const actual = lista.find((g) => g.grupoId === grupoId);
            if (actual) actualizarCantidadGrupo(grupoId, actual.cantidad + 1);
          }}
          onDecrementar={(grupoId) => {
            const actual = lista.find((g) => g.grupoId === grupoId);
            if (!actual) return;
            if (actual.cantidad <= 1) {
              quitarGrupo(grupoId);
              return;
            }
            actualizarCantidadGrupo(grupoId, actual.cantidad - 1);
          }}
          onIncrementarOpcion={(grupoId, productoId) => {
            const grupoActual = lista.find((g) => g.grupoId === grupoId);
            const opcionActual = grupoActual?.opciones.find((p) => p.id === productoId);
            const cantidadActual = opcionActual?.cantidadOpcion ?? 1;
            actualizarCantidadOpcion(grupoId, productoId, cantidadActual + 1);
          }}
          onDecrementarOpcion={(grupoId, productoId) => {
            const grupoActual = lista.find((g) => g.grupoId === grupoId);
            const opcionActual = grupoActual?.opciones.find((p) => p.id === productoId);
            const cantidadActual = opcionActual?.cantidadOpcion ?? 1;
            if (cantidadActual > 1) {
              actualizarCantidadOpcion(grupoId, productoId, cantidadActual - 1);
            }
          }}
          onEliminarOpcion={quitarOpcion}
          onEliminarGrupo={quitarGrupo}
          onToggleComprado={toggleCompradoGrupo}
          onActualizarNombre={actualizarNombreGrupo}
        />
      ))}

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
  const checkAuth = useListaStore((state) => state.checkAuth);
  const user = useListaStore((state) => state.user);
  const listaId = useListaStore((state) => state.listaId);
  const listaRol = useListaStore((state) => state.listaRol);
  const listaNombre = useListaStore((state) => state.listaNombre);
  const setListaNombre = useListaStore((state) => state.setListaNombre);
  
  const isListaVacia = totalEnLista === 0;

  // Solo el owner o listas sin ID (locales) pueden editar el nombre
  const esOwner = !listaId || listaRol === 'owner';
  const puedeEditar = !listaId || listaRol === 'owner' || listaRol === 'editor';

  // Estados locales para la edición en línea del título
  const [editandoNombre, setEditandoNombre] = useState(false);
  const [nombreTemporal, setNombreTemporal] = useState(listaNombre ?? 'Mi lista');
  const [modoSimplificado, setModoSimplificado] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Estado para el modal de compartir contenido de la lista
  const [modalCompartir, setModalCompartir] = useState<ModalCompartirState>({ isOpen: false, listaId: null });
  const [modalCompartirContenido, setModalCompartirContenido] = useState<ModalCompartirContenidoState>({
    isOpen: false,
    listaId: null,
    listaNombre: '',
  });

  const {
    modalGuardarOpen,
    modalCerrarOpen,
    loadingGuardar,
    loadingSincronizar,
    sincronizadoOk,
    hayCambios,
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

  useEffect(() => {
    if (listaNombre) {
      setNombreTemporal(listaNombre);
    }
  }, [listaNombre]);

  useEffect(() => {
    if (editandoNombre && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editandoNombre]);

  const guardarNuevoNombre = () => {
    const nombreLimpio = nombreTemporal.trim();
    if (nombreLimpio && esOwner) {
      setListaNombre(nombreLimpio);
    } else {
      setNombreTemporal(listaNombre ?? 'Mi lista');
    }
    setEditandoNombre(false);
  };

  return (
    <BaseContainer>
      {/* Contenedor principal dividido en 2 filas */}
      <div className="mb-6 flex flex-col gap-3 px-1 w-full border-b border-slate-50 pb-4">
        
        {/* PRIMERA FILA: Título editable y botones de compartir alineados de izquierda a derecha */}
        <div className="flex items-center justify-between w-full min-w-0 flex-wrap gap-2">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {editandoNombre && esOwner ? (
              <input
                ref={inputRef}
                type="text"
                value={nombreTemporal}
                onChange={(e) => setNombreTemporal(e.target.value)}
                onBlur={guardarNuevoNombre}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') guardarNuevoNombre();
                  if (e.key === 'Escape') {
                    setNombreTemporal(listaNombre ?? 'Mi lista');
                    setEditandoNombre(false);
                  }
                }}
                className="text-xl sm:text-2xl font-black text-slate-900 bg-transparent border-b-2 border-orange-500 outline-none w-full tracking-tight"
              />
            ) : (
              <div 
                onClick={() => {
                  if (esOwner) setEditandoNombre(true);
                }}
                className={`group flex items-center gap-2 w-fit ${esOwner ? 'cursor-pointer' : ''}`}
                title={esOwner ? 'Hacé clic para cambiar el nombre' : undefined}
              >
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight truncate">
                  {listaNombre ?? 'Mi lista'}
                </h1>
                {esOwner && (
                  <PencilSimpleIcon size={18} weight="bold" className="text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                )}
              </div>
            )}
          </div>

          {/* Botones de Compartir en la misma primera fila, de izquierda a derecha */}
          {user && listaId && (
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setModalCompartirContenido({
                  isOpen: true,
                  listaId: listaId,
                  listaNombre: listaNombre ?? 'Mi lista'
                })}
                title="Compartir contenido"
                className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50/50 px-3 py-1.5 text-xs font-bold text-emerald-700 shadow-sm transition-all hover:bg-emerald-100 hover:border-emerald-300"
              >
                <ShareNetworkIcon size={16} weight="bold" />
                <span className="hidden sm:inline">Compartir contenido</span>
              </button>

              <button
                onClick={() => setModalCompartir({
                  isOpen: true,
                  listaId: listaId
                })}
                title="Compartir colaboradores"
                className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50/50 px-3 py-1.5 text-xs font-bold text-emerald-700 shadow-sm transition-all hover:bg-emerald-100 hover:border-emerald-300"
              >
                <UsersIcon size={16} weight="bold" />
                <span className="hidden sm:inline">Colaboradores</span>
              </button>
            </div>
          )}
        </div>

        {/* SEGUNDA FILA: en mobile, grid de columnas iguales a todo el ancho; en md vuelve al flex original */}
        <div className="grid grid-flow-col auto-cols-fr gap-2 w-full md:flex md:flex-wrap md:items-center">
          {/* Botón de simplificar */}
          <button
            onClick={() => setModoSimplificado((prev) => !prev)}
            className="w-full md:w-auto rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[11px] sm:text-xs font-bold text-slate-600 shadow-sm transition-all hover:border-orange-300 hover:text-orange-600"
          >
            {modoSimplificado ? 'Desplegar' : 'Simplificar'}
          </button>

          {/* Botón de ver mejor precio */}
          <DesktopActionButton
            href="/comparativa"
            label="Conocé el mejor precio"
            icon={<ScalesIcon weight="bold" />}
            disabled={isListaVacia}
            className="hidden md:inline-flex"
          />

          {/* Botón de agregar productos */}
          <DesktopActionButton
            href="/buscar"
            label="Agregá productos"
            icon={<MagnifyingGlassIcon weight="bold" />}
            color="naranja"
            variant="solid"
            className="hidden md:inline-flex"
          />

          {/* Botón Guardar / Sincronizar */}
          {!isListaVacia && puedeEditar && (
            <DesktopActionButton
              onClick={listaId ? (hayCambios ? handleSincronizar : undefined) : abrirModalGuardar}
              disabled={loadingSincronizar || (!!listaId && !hayCambios)}
              label={
                loadingSincronizar ? 'Guardando...' :
                  sincronizadoOk || (listaId && !hayCambios) ? 'Guardado' :
                    listaId ? 'Guardar cambios' : 'Guardar lista'
              }
              icon={
                loadingSincronizar ? <CircleNotchIcon size={18} weight="bold" className="animate-spin" /> :
                  sincronizadoOk || (listaId && !hayCambios)
                    ? <CheckCircleIcon weight="bold" />
                    : <FloppyDiskIcon weight="bold" />
              }
              color={sincronizadoOk ? 'verde' : 'lila'}
              variant="solid"
              className="flex w-full justify-center md:inline-flex md:w-auto"
            />
          )}

          {/* Botón Cerrar lista */}
          {listaId && (
            <DesktopActionButton
              onClick={() => {
                if (!puedeEditar || !hayCambios) {
                  void handleCerrarLista(false);
                  return;
                }
                abrirModalCerrar();
              }}
              label="Cerrar lista"
              icon={<XCircleIcon weight="bold" />}
              color="rojo"
              variant="outline"
              className="flex w-full justify-center md:inline-flex md:w-auto"
            />
          )}

          {/* Botón Vaciar lista */}
          {!listaId && (
            <DesktopActionButton
              onClick={handleLimpiarLista}
              label="Vaciar lista"
              icon={<ShoppingCartIcon weight="bold" />}
              color="rojo"
              variant="outline"
              disabled={isListaVacia}
              className="flex w-full justify-center md:inline-flex md:w-auto"
            />
          )}
        </div>
      </div>

      <Suspense fallback={<p className="text-center text-sm text-slate-400 py-4">Cargando tus productos...</p>}>
        <ListaProductos simplificado={modoSimplificado} />
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

      {/* Modal compartir */}
      <CompartirListaModal
        isOpen={modalCompartir.isOpen}
        onClose={() => setModalCompartir({ isOpen: false, listaId: null })}
        listaId={modalCompartir.listaId}
      />
      <CompartirContenidoListaModal
        isOpen={modalCompartirContenido.isOpen}
        onClose={() => setModalCompartirContenido({ isOpen: false, listaId: null, listaNombre: '' })}
        listaId={modalCompartirContenido.listaId}
        listaNombre={modalCompartirContenido.listaNombre}
      />
    </BaseContainer>
  );
}