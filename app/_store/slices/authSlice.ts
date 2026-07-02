import { StateCreator } from 'zustand';
import type { StoreState } from '../store';
import { authClient } from '../../_lib/auth-client';

// Ajustá esta interfaz según lo que te devuelva Better Auth
export interface UserSession {
  id: string;
  email: string;
  name: string;
}

export interface AuthSlice {
  user: UserSession | null;
  loadingAuth: boolean; // Reemplaza al useState(false) que teníamos en el hook
  
  setUser: (user: UserSession | null) => void;
  loginConEmail: (email: string, password: string) => Promise<{ success: boolean; error?: any }>;
  registroConEmail: (email: string, password: string, name: string) => Promise<{ success: boolean; error?: any }>;
  logout: () => Promise<void>;
}

export const createAuthSlice: StateCreator<StoreState, [], [], AuthSlice> = (set, get) => ({
  user: null,
  loadingAuth: false,
  
  setUser: (user) => set({ user }),

  // 1. Iniciar Sesión (Directo desde Zustand)
  loginConEmail: async (email, password) => {
    set({ loadingAuth: true });
    try {
      const { data, error } = await authClient.signIn.email({ email, password });
      if (data) {
        // Guardamos al usuario y apagamos el loading
        set({ user: data.user as UserSession, loadingAuth: false });
        return { success: true };
      }
      set({ loadingAuth: false });
      return { success: false, error };
    } catch (error) {
      set({ loadingAuth: false });
      return { success: false, error };
    }
  },

  // 2. Registrarse (Directo desde Zustand)
  registroConEmail: async (email, password, name) => {
    set({ loadingAuth: true });
    try {
      const { data, error } = await authClient.signUp.email({ email, password, name });
      if (data) {
        // Better Auth lo loguea automático
        set({ user: data.user as UserSession, loadingAuth: false });
        return { success: true };
      }
      set({ loadingAuth: false });
      return { success: false, error };
    } catch (error) {
      set({ loadingAuth: false });
      return { success: false, error };
    }
  },
  
  // 3. Cerrar Sesión (Ahora es asíncrono)
  logout: async () => {
    set({ loadingAuth: true });
    try {
      await authClient.signOut();
    } finally {
      set({ user: null, loadingAuth: false });
      // Limpiamos el carrito por seguridad interactuando con el otro slice
      get().limpiarLista(); 
    }
  }
});