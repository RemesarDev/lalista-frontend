import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createListaSlice, type CacheBusquedaPrecios, type ListaSlice, type ProductoBusqueda, type ProductoLista, type SucursalBusqueda } from './slices/listaSlice';
import { createUbicacionSlice, type UbicacionSlice } from './slices/ubicacionSlice';
import { createAuthSlice, type AuthSlice } from './slices/authSlice'; // <-- NUEVO

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
      // IMPORTANTE: Le decimos a Zustand que NO guarde al usuario en localStorage
      // Better Auth ya lo maneja seguro con cookies.
      partialize: (state) => ({ 
        lista: state.lista, 
        ubicacion: state.ubicacion,
        cacheBusquedaPrecios: state.cacheBusquedaPrecios,
      }),
    }
  )
);