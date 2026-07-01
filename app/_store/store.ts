import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createListaSlice, type ListaSlice } from './slices/listaSlice';
import { createUbicacionSlice, type UbicacionSlice } from './slices/ubicacionSlice';

export type StoreState = ListaSlice & UbicacionSlice;

export const useListaStore = create<StoreState>()(
  persist(
    (...a) => ({
      ...createListaSlice(...a),
      ...createUbicacionSlice(...a),
    }),
    {
      name: 'lalista-storage',
    }
  )
);