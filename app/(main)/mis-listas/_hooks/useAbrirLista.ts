// app/(main)/mis-listas/_hooks/useAbrirLista.ts
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useListaStore } from '@/app/_store/store';
import type { RolLista, GrupoLista, ProductoOpcion } from '@/app/_store/slices/listaSlice';
import type { ItemLista } from '@/app/_types/listas';

interface UseAbrirListaReturn {
  abrirLista: (id: string, rol: RolLista) => Promise<void>;
  cargandoAbrir: boolean;
  errorAbrir: string | null;
}

// Transforma ItemLista[] (dominio) → GrupoLista[] (Zustand)
const transformarItemsAGrupos = (items: ItemLista[]): GrupoLista[] => {
  return items.map((item) => ({
    grupoId: item.grupoId,
    cantidad: item.cantidad,
    comprado: item.comprado,
    opciones: item.opciones.map((opcion): Omit<ProductoOpcion, 'actualizadoEn'> & { actualizadoEn: number } => ({
      id: opcion.id,
      nombre: opcion.nombre,
      url_imagen: opcion.url_imagen ?? null,
      sucursales: [], // los precios se recargan cuando el usuario los necesite
      actualizadoEn: 0, // forzamos recarga de precios al abrir
    })),
  }));
};

export function useAbrirLista(): UseAbrirListaReturn {
  const router = useRouter();
  const setListaActiva = useListaStore((state) => state.setListaActiva);
  const limpiarLista = useListaStore((state) => state.limpiarLista);

  const [cargandoAbrir, setCargandoAbrir] = useState(false);
  const [errorAbrir, setErrorAbrir] = useState<string | null>(null);

  const abrirLista = async (id: string, rol: RolLista) => {
    setCargandoAbrir(true);
    setErrorAbrir(null);

    try {
      const res = await fetch(`/api/listas/${id}/items`, { credentials: 'include' });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error ?? 'Error al abrir la lista');
      }

      const { items } = await res.json();
      const grupos = transformarItemsAGrupos(items as ItemLista[]);

      // Limpiamos la lista local y cargamos la de la nube
      limpiarLista();

      // Seteamos los grupos manualmente en el store
      useListaStore.setState({ lista: grupos });

      // Vinculamos la lista activa
      setListaActiva(id, rol);

      router.push('/mi-lista');
    } catch (err: any) {
      setErrorAbrir(err.message ?? 'Error inesperado');
    } finally {
      setCargandoAbrir(false);
    }
  };

  return { abrirLista, cargandoAbrir, errorAbrir };
}