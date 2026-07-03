import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// 1. Importaciones de Funciones (código ejecutable)
import { createListaSlice } from './slices/listaSlice';
import { createUbicacionSlice } from './slices/ubicacionSlice';
import { createAuthSlice } from './slices/authSlice';

// 2. Importaciones estrictas de Tipos/Interfaces
import type { 
  CacheBusquedaPrecios, 
  ListaSlice, 
  ProductoBusqueda, 
  ProductoLista, 
  SucursalBusqueda 
} from './slices/listaSlice';
import type { UbicacionSlice, UbicacionUsuario } from './slices/ubicacionSlice';
import type { AuthSlice } from './slices/authSlice';

export type StoreState = ListaSlice & UbicacionSlice & AuthSlice;
export type { CacheBusquedaPrecios, ProductoBusqueda, ProductoLista, SucursalBusqueda, UbicacionUsuario };

export const useListaStore = create<StoreState>()(
  persist(
    (...a) => ({
      ...createListaSlice(...a),
      ...createUbicacionSlice(...a),
      ...createAuthSlice(...a),
    }),
    {
      name: 'lalista-storage',
      version: 3, 
      
      migrate: (persistedState: any, version: number) => {
        return persistedState || {};
      },
      
      // Patrón OMIT: Extraemos todo lo relacionado a la sesión y estados efímeros.
      partialize: (state) => {
        // Se omiten 'user' y 'loadingAuth' para evitar brechas de seguridad y estados de carga infinitos.
        const { user, loadingAuth, ...restoDelEstado } = state as any;
        return restoDelEstado;
      },
    }
  )
);