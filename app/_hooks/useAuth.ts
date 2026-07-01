import { authClient } from '../_lib/auth-client';
import { useListaStore, type StoreState } from '../_store/store';
import { useState } from 'react';

export const useAuth = () => {
  const [loading, setLoading] = useState(false);
  
  // Extraemos lo que necesitamos de Zustand, tipando explícitamente el state
  const setUser = useListaStore((state: StoreState) => state.setUser);
  const user = useListaStore((state: StoreState) => state.user);

  // 1. Iniciar Sesión
  const loginConEmail = async (email: string, password: string) => {
    setLoading(true);
    try {
      const { data, error } = await authClient.signIn.email({ email, password });
      if (data) {
        setUser(data.user); // Sincroniza Zustand
        return { success: true };
      }
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };

  // 2. Registrarse
  const registroConEmail = async (email: string, password: string, name: string) => {
    setLoading(true);
    try {
      const { data, error } = await authClient.signUp.email({ 
        email, 
        password, 
        name 
      });
      
      if (data) {
        // Better Auth autologuea al usuario tras el registro exitoso
        setUser(data.user); 
        return { success: true };
      }
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };

  // 3. Cerrar Sesión
  const logout = async () => {
    setLoading(true);
    try {
      await authClient.signOut();
      useListaStore.getState().logout(); // Limpia Zustand y el carrito
    } finally {
      setLoading(false);
    }
  };

  return {
    user,
    loading,
    loginConEmail,
    registroConEmail,
    logout
  };
};