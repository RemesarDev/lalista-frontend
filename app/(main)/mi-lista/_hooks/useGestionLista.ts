// app/(main)/mi-lista/_hooks/useGestionLista.ts
'use client';

import { useState } from 'react';
import { useListaStore } from '@/app/_store/store';

interface UseGestionListaReturn {
  // Estado de modales
  modalGuardarOpen: boolean;
  modalCerrarOpen: boolean;
  loadingGuardar: boolean;
  loadingSincronizar: boolean;
  sincronizadoOk: boolean;
  hayCambios: boolean;

  // Acciones de modales
  abrirModalGuardar: () => void;
  cerrarModalGuardar: () => void;
  abrirModalCerrar: () => void;
  cerrarModalCerrar: () => void;

  // Acciones principales
  handleGuardarLista: (nombre: string) => Promise<void>;
  handleSincronizar: () => Promise<void>;
  handleCerrarLista: (sincronizar: boolean) => Promise<void>;
  handleLimpiarLista: () => void;
}

export function useGestionLista(): UseGestionListaReturn {
  const lista = useListaStore((state) => state.lista);
  const listaId = useListaStore((state) => state.listaId);
  const hayCambios = useListaStore((state) => state.listaModificada);
  const limpiarLista = useListaStore((state) => state.limpiarLista);
  const setListaActiva = useListaStore((state) => state.setListaActiva);
  const marcarListaSincronizada = useListaStore((state) => state.marcarListaSincronizada);

  const [modalGuardarOpen, setModalGuardarOpen] = useState(false);
  const [modalCerrarOpen, setModalCerrarOpen] = useState(false);
  const [loadingGuardar, setLoadingGuardar] = useState(false);
  const [loadingSincronizar, setLoadingSincronizar] = useState(false);
  const [sincronizadoOk, setSincronizadoOk] = useState(false);

  const buildItems = () => lista.map((grupo) => ({
    item_id: grupo.grupoId,
    cantidad: grupo.cantidad,
    comprado: grupo.comprado ?? false,
    opciones: grupo.opciones.map((opcion, index) => ({
      id_producto: opcion.id,
      descripcion: opcion.nombre,
      imagen: opcion.url_imagen ?? null,
      es_principal: index === 0,
    })),
  }));

  // POST — crea una lista nueva
  const handleGuardarLista = async (nombre: string) => {
    setLoadingGuardar(true);
    try {
      const res = await fetch('/api/listas', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, items: buildItems() }),
      });

      if (!res.ok) throw new Error('Error al guardar la lista');

      const { id } = await res.json();
      marcarListaSincronizada();
      setListaActiva(id, 'owner');
      setModalGuardarOpen(false);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingGuardar(false);
    }
  };

  // PATCH — sincroniza lista existente
  const handleSincronizar = async () => {
    if (!listaId) return;
    setLoadingSincronizar(true);
    try {
      const res = await fetch(`/api/listas/${listaId}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: buildItems() }),
      });

      if (!res.ok) throw new Error('Error al sincronizar la lista');

      marcarListaSincronizada();

      // Feedback temporal de éxito
      setSincronizadoOk(true);
      setTimeout(() => setSincronizadoOk(false), 2000);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingSincronizar(false);
    }
  };

  // Cerrar lista con opción de sincronizar antes
  const handleCerrarLista = async (sincronizar: boolean) => {
    if (sincronizar) await handleSincronizar();
    limpiarLista();
    setModalCerrarOpen(false);
  };

  // Limpiar lista local sin sincronizar
  const handleLimpiarLista = () => {
    if (!lista.length) return;
    limpiarLista();
  };

  return {
    modalGuardarOpen,
    modalCerrarOpen,
    loadingGuardar,
    loadingSincronizar,
    sincronizadoOk,
    hayCambios,
    abrirModalGuardar: () => setModalGuardarOpen(true),
    cerrarModalGuardar: () => setModalGuardarOpen(false),
    abrirModalCerrar: () => setModalCerrarOpen(true),
    cerrarModalCerrar: () => setModalCerrarOpen(false),
    handleGuardarLista,
    handleSincronizar,
    handleCerrarLista,
    handleLimpiarLista,
  };
}