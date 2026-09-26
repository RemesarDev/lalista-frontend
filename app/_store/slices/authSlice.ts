import { StateCreator } from 'zustand';
import type { StoreState } from '../store';
import { authClient, type User } from '../../_lib/auth-client';

export interface AuthSlice {
  user: User | null;
  loadingAuth: boolean;
  
  setUser: (user: User | null) => void;
  loginConEmail: (email: string, password: string) => Promise<{ success: boolean; error?: any }>;
  registroConEmail: (email: string, password: string, name: string) => Promise<{ success: boolean; error?: any }>;
  logout: () => Promise<void>;
  borrarCuenta: (password: string) => Promise<{ success: boolean; error?: any }>;
  checkAuth: () => Promise<User | null>;
}

export const createAuthSlice: StateCreator<StoreState, [], [], AuthSlice> = (set, get) => ({
  user: null,
  loadingAuth: false,
  
  setUser: (user) => set({ user }),

  checkAuth: async () => {
    set({ loadingAuth: true });
    try {
      const { data } = await authClient.getSession();
      const nextUser = data?.user || null;
      set({ user: nextUser });

      // Si hay sesión, hidratamos las direcciones guardadas
      if (nextUser) {
        await get().cargarDirecciones();
      }

      return nextUser;
    } catch {
      set({ user: null });
      return null;
    } finally {
      set({ loadingAuth: false });
    }
  },

  loginConEmail: async (email, password) => {
    set({ loadingAuth: true });
    try {
      const { data, error } = await authClient.signIn.email({ email, password });
      if (data) {
        set({ user: data.user, loadingAuth: false });
        await get().cargarDirecciones();
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
      get().limpiarDirecciones();
    }
  },

  borrarCuenta: async (password) => {
    set({ loadingAuth: true });
    try {
      const { error } = await authClient.deleteUser({ password });

      if (error) {
        set({ loadingAuth: false });
        return { success: false, error };
      }

      await authClient.signOut();
      set({ user: null, loadingAuth: false });
      get().limpiarLista();
      get().limpiarDirecciones();

      return { success: true };
    } catch (error) {
      set({ loadingAuth: false });
      return { success: false, error };
    }
  }
});