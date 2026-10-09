import { StateCreator } from 'zustand';
import type { StoreState } from '../store';
import { authClient, type User } from '../../_lib/auth-client';
import { analytics } from '@/app/_lib/services/analyticsService';


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
  loadingAuth: true,
  
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
      if (data?.user) {
        set({ user: data.user, loadingAuth: false });
        
        // 🚀 Registramos analíticamente el inicio de sesión exitoso
        analytics.userLogin(data.user.id).catch(console.error);

        // La foto va antes de cargarDirecciones, que es justo quien la pisa.
        const ubicacionLocal = { ...get().ubicacion };
        await get().cargarDirecciones();
        get().ofrecerConservarUbicacion(ubicacionLocal);

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
      if (data?.user) {
        set({ user: data.user, loadingAuth: false });
        
        // 🚀 Registramos analíticamente el nuevo registro de usuario
        analytics.userSignup(data.user.id).catch(console.error);

        // El lugar que venía marcando como anónimo no está en ninguna cuenta.
        // Mismo recorrido que el login aunque en una cuenta nueva
        // cargarDirecciones vuelva vacío: un solo camino vale más que un GET.
        const ubicacionLocal = { ...get().ubicacion };
        await get().cargarDirecciones();
        get().ofrecerConservarUbicacion(ubicacionLocal);

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
      // Sin esto queda el barrio visible en el header y cero sucursales, y la
      // comparativa dice "no hay disponibilidad en tu zona", que es mentira.
      // Además, en un dispositivo compartido la dirección del que se fue
      // seguiría a la vista.
      get().limpiarUbicacion();
    }
  },

  borrarCuenta: async (password) => {
    set({ loadingAuth: true });
    try {
      // Necesitamos capturar el ID antes de limpiar la sesión para reportar la baja
      const currentUser = get().user;
      const { error } = await authClient.deleteUser({ password });

      if (error) {
        if (error.message === 'DELETION_SCHEDULED') {
          if (currentUser?.id) {
            await analytics.userDeleted(currentUser.id).catch(console.error);
          }
          await authClient.signOut();
          set({ user: null, loadingAuth: false });
          get().limpiarLista();
          get().limpiarDirecciones();
          get().limpiarUbicacion();
          return { success: true };
        }
        set({ loadingAuth: false });
        return { success: false, error };
      }

      // better-auth siempre retorna DELETION_SCHEDULED con el soft delete configurado
      set({ loadingAuth: false });
      return { success: false, error: new Error('Respuesta inesperada del servidor') };
    } catch (error) {
      set({ loadingAuth: false });
      return { success: false, error };
    }
  }
});