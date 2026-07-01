import { StateCreator } from 'zustand';
import { StoreState } from '../store';

// Ajustá esta interfaz según lo que te devuelva Better Auth
export interface UserSession {
  id: string;
  email: string;
  name: string;
}

export interface AuthSlice {
  user: UserSession | null;
  setUser: (user: UserSession | null) => void;
  logout: () => void;
}

export const createAuthSlice: StateCreator<StoreState, [], [], AuthSlice> = (set, get) => ({
  user: null,
  
  setUser: (user) => set({ user }),
  
  logout: () => {
    set({ user: null });
    // Como usamos Slices, al hacer logout podés limpiar el carrito por seguridad
    get().limpiarLista(); 
  }
});