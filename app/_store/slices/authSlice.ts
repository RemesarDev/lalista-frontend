import { StateCreator } from 'zustand';
import type { StoreState } from '../store';
// Importamos el cliente y el tipo inferido automáticamente
import { authClient, type User } from '../../_lib/auth-client';

export interface AuthSlice {
  user: User | null; // Usamos el tipo inferido, no la interfaz manual
  loadingAuth: boolean;
  
  setUser: (user: User | null) => void;
  loginConEmail: (email: string, password: string) => Promise<{ success: boolean; error?: any }>;
  registroConEmail: (email: string, password: string, name: string) => Promise<{ success: boolean; error?: any }>;
  logout: () => Promise<void>;
  // Añadimos esta acción vital para sincronizar el estado al cargar la página
  checkAuth: () => Promise<void>;
}

export const createAuthSlice: StateCreator<StoreState, [], [], AuthSlice> = (set, get) => ({
  user: null,
  loadingAuth: false,
  
  setUser: (user) => set({ user }),

  // NUEVO: Verificación de sesión al montar la app
  checkAuth: async () => {
    set({ loadingAuth: true });
    const { data } = await authClient.getSession();
    set({ user: data?.user || null, loadingAuth: false });
  },

  loginConEmail: async (email, password) => {
    set({ loadingAuth: true });
    try {
      const { data, error } = await authClient.signIn.email({ email, password });
      if (data) {
        set({ user: data.user, loadingAuth: false }); // Ya no necesitas el "as UserSession"
        return { success: true };
      }
      set({ loadingAuth: false });
      return { success: false, error };
    } catch (error) {
      set({ loadingAuth: false });
      return { success: false, error };
    }
  },

  registroConEmail: async (email, password, name) => {
    set({ loadingAuth: true });
    try {
      const { data, error } = await authClient.signUp.email({ email, password, name });
      if (data) {
        set({ user: data.user, loadingAuth: false });
        return { success: true };
      }
      set({ loadingAuth: false });
      return { success: false, error };
    } catch (error) {
      set({ loadingAuth: false });
      return { success: false, error };
    }
  },
  
  logout: async () => {
    set({ loadingAuth: true });
    try {
      await authClient.signOut();
    } finally {
      set({ user: null, loadingAuth: false });
      get().limpiarLista(); 
    }
  }
});