// app/(main)/mi-lista/_hooks/useGestionLista.ts
'use client';

import { useState } from 'react';
import { useListaStore } from '@/app/_store/store';
import { USER_LIMITS } from '@/app/_lib/constants/limites';
import { avisar } from '@/app/_lib/avisos';

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
  /** Devuelve true si se guardó. */
  handleSincronizar: () => Promise<boolean>;
  handleCerrarLista: (sincronizar: boolean) => Promise<void>;
  handleLimpiarLista: () => void;
}

export function useGestionLista(): UseGestionListaReturn {
  const lista = useListaStore((state) => state.lista);
  const listaNombre = useListaStore((state) => state.listaNombre);
  const hayCambios = useListaStore((state) => state.listaModificada);
  const limpiarLista = useListaStore((state) => state.limpiarLista);
  const setListaActiva = useListaStore((state) => state.setListaActiva);
  const marcarListaSincronizada = useListaStore((state) => state.marcarListaSincronizada);
  const abrirModalLimite = useListaStore((state) => state.abrirModalLimite); 

  const [modalGuardarOpen, setModalGuardarOpen] = useState(false);
  const [modalCerrarOpen, setModalCerrarOpen] = useState(false);
  const [loadingGuardar, setLoadingGuardar] = useState(false);
  const [loadingSincronizar, setLoadingSincronizar] = useState(false);
  const [sincronizadoOk, setSincronizadoOk] = useState(false);

  // Se lee del store al momento de guardar (no del render): así un
  // "Reintentar" que se toca más tarde manda la lista actualizada.
  const buildItems = () => useListaStore.getState().lista.map((grupo) => ({
    item_id: grupo.grupoId,
    cantidad: grupo.cantidad,
    comprado: grupo.comprado ?? false,
    nombre_personalizado: grupo.nombrePersonalizado ?? null,
    opciones: grupo.opciones.map((opcion, index) => ({
      id_producto: opcion.id,
      descripcion: opcion.nombre,
      imagen: opcion.url_imagen ?? null,
      es_principal: index === 0,
      cantidad_opcion: opcion.cantidadOpcion ?? 1,
    })),
  }));

  // POST — crea una lista nueva
  const handleGuardarLista = async (nombre: string) => {
    // Validamos el límite antes de realizar el POST
    if (lista.length > USER_LIMITS.MAX_ITEMS_POR_LISTA) {
      setModalGuardarOpen(false);
      abrirModalLimite(`Has alcanzado el límite máximo de ${USER_LIMITS.MAX_ITEMS_POR_LISTA} ítems permitidos en esta lista.`);
      return;
    }

    setLoadingGuardar(true);
    try {
      const res = await fetch('/api/listas', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, items: buildItems() }),
      });

      const data = await res.json().catch(() => ({}));

      // Si el backend responde con un 403 (Límite alcanzado)
      if (res.status === 403) {
        setModalGuardarOpen(false);
        abrirModalLimite(data.message || 'Has alcanzado el límite permitido.');
        return;
      }

      if (!res.ok) throw new Error(data.error || 'Error al guardar la lista');

      const { id } = data;
      marcarListaSincronizada();
      setListaActiva(id, 'owner', nombre);
      setModalGuardarOpen(false);
      avisar.exito(`Guardaste la lista ${nombre}`);
    } catch (err) {
      console.error(err);
      avisar.error('No pudimos guardar la lista. Probá de nuevo.');
    } finally {
      setLoadingGuardar(false);
    }
  };

  // PATCH — sincroniza lista existente
  const handleSincronizar = async (): Promise<boolean> => {
    // Validamos el límite antes de sincronizar
    if (lista.length > USER_LIMITS.MAX_ITEMS_POR_LISTA) {
      abrirModalLimite(`Has alcanzado el límite máximo de ${USER_LIMITS.MAX_ITEMS_POR_LISTA} ítems permitidos en esta lista.`);
      return false;
    }

    const idActual = useListaStore.getState().listaId;
    if (!idActual) return false;
    
    setLoadingSincronizar(true);
    try {
      const res = await fetch(`/api/listas/${idActual}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: buildItems() }),
      });

      const data = await res.json().catch(() => ({}));

      // Manejo de límite por si acaso en sincronización o actualización
      if (res.status === 403) {
        abrirModalLimite(data.message || 'Has alcanzado el límite permitido.');
        return false;
      }

      if (!res.ok) throw new Error('Error al sincronizar la lista');

      marcarListaSincronizada();

      // Feedback temporal de éxito
      setSincronizadoOk(true);
      setTimeout(() => setSincronizadoOk(false), 2000);
      return true;
    } catch (err) {
      console.error(err);
      avisar.error('No se guardaron los cambios de tu lista.', () => void handleSincronizar());
      return false;
    } finally {
      setLoadingSincronizar(false);
    }
  };

  // Cerrar lista con opción de sincronizar antes
  const handleCerrarLista = async (sincronizar: boolean) => {
    const nombre = listaNombre;
    if (sincronizar) {
      const guardado = await handleSincronizar();
      if (!guardado) return;
    }
    limpiarLista();
    setModalCerrarOpen(false);
    if (nombre) avisar.info(`Cerraste ${nombre}. La encontrás en Mis listas.`);
  };

  // Limpiar lista local sin sincronizar (se puede deshacer)
  const handleLimpiarLista = () => {
    if (!lista.length) return;

    const estado = useListaStore.getState();
    const antes = {
      lista: estado.lista,
      listaId: estado.listaId,
      listaRol: estado.listaRol,
      listaNombre: estado.listaNombre,
      listaModificada: estado.listaModificada,
    };

    limpiarLista();

    avisar.deshacer('Vaciaste tu lista', () =>
      useListaStore.setState((state) => ({
        ...antes,
        lista: [
          ...antes.lista,
          ...state.lista.filter((g) => !antes.lista.some((a) => a.grupoId === g.grupoId)),
        ],
      }))
    );
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