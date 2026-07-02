import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createListaSlice, type CacheBusquedaPrecios, type ListaSlice, type ProductoBusqueda, type ProductoLista, type SucursalBusqueda } from './slices/listaSlice';
import { createUbicacionSlice, type UbicacionSlice } from './slices/ubicacionSlice';
import { createAuthSlice, type AuthSlice } from './slices/authSlice';

export type StoreState = ListaSlice & UbicacionSlice & AuthSlice;
export type { CacheBusquedaPrecios, ProductoBusqueda, ProductoLista, SucursalBusqueda };

export const useListaStore = create<StoreState>()(
  persist(
    (...a) => ({
      ...createListaSlice(...a),
      ...createUbicacionSlice(...a),
      ...createAuthSlice(...a),
    }),
    {
      name: 'lalista-storage',
      // IMPORTANTE: Le decimos a Zustand qué guardar en localStorage.
      // Dejamos afuera a `user` por seguridad (lo maneja Better Auth),
      // pero incluimos el buscador para que funcione idéntico a la rama main.
      partialize: (state) => ({ 
        lista: state.lista, 
        ubicacion: state.ubicacion,
        cacheBusquedaPrecios: state.cacheBusquedaPrecios,
        terminoBusqueda: state.terminoBusqueda,
        timeTerminoBusqueda: state.timeTerminoBusqueda
      }),
    }
  )
);