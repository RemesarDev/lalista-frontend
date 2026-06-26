import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// 1. Definimos las estructuras de datos (Types)
export interface ProductoLista {
  id: string;         // ID único del producto (viene del SEPA / Supabase)
  nombre: string;     // Nombre del producto (ej: "Leche Entera 1L")
  marca: string;      // Marca para mostrar en la lista
  url_imagen: string | null;
  cantidad: number;   // Cuántas unidades lleva el usuario
}

export interface UbicacionUsuario {
  latitud: number | null;
  longitud: number | null;
  precision: number | null;     // En metros
  radioBusqueda: number;
  nombreLugar: string | null;   // Ej: "Ituzaingó, Buenos Aires"
  cargandoUbicacion: boolean;   // Para mostrar un spinner visual
}

interface ListaState {
  // Estado
  lista: ProductoLista[];
  ubicacion: UbicacionUsuario;
  
  // Acciones (Funciones para modificar el estado)
  agregarProducto: (producto: Omit<ProductoLista, 'cantidad'>) => void;
  eliminarProducto: (id: string) => void;
  actualizarCantidad: (id: string, cantidad: number) => void;
  limpiarLista: () => void;
  cambiarRadioBusqueda: (nuevoRadio: number) => void;
  setUbicacion: (ubicacion: UbicacionUsuario) => void;
  obtenerGpsNavegador: () => void;
}

// 2. Creamos el Store con Persistencia Automática
export const useListaStore = create<ListaState>()(
  persist(
    (set, get) => ({
      // Estado inicial unificado
      lista: [],
      ubicacion: { 
        latitud: null, 
        longitud: null, 
        precision: null, 
        radioBusqueda: 1,
        nombreLugar: null,
        cargandoUbicacion: false 
      },

      // Acción: Obtener GPS del Navegador
      obtenerGpsNavegador: () => {
        set((state) => ({ ubicacion: { ...state.ubicacion, cargandoUbicacion: true } }));

        if (typeof window === 'undefined' || !navigator.geolocation) {
          alert("Tu navegador no soporta geolocalización o estás en el servidor.");
          set((state) => ({ ubicacion: { ...state.ubicacion, cargandoUbicacion: false } }));
          return;
        }

        navigator.geolocation.getCurrentPosition(
          (posicion) => {
            // Usamos get() para mantener el radio de búsqueda que el usuario ya tenía configurado
            const radioActual = get().ubicacion.radioBusqueda;
            set({
              ubicacion: {
                latitud: posicion.coords.latitude,
                longitud: posicion.coords.longitude,
                precision: posicion.coords.accuracy,
                radioBusqueda: radioActual, // Corregido: Mantiene el radio previo
                nombreLugar: "Ubicación por GPS",
                cargandoUbicacion: false,
              },
            });
          },
          (error) => {
            console.error("Error al obtener la ubicación web:", error);
            set((state) => ({ 
              ubicacion: { ...state.ubicacion, cargandoUbicacion: false } 
            }));
            alert("No pudimos obtener tu ubicación. Por favor, seleccionala manualmente.");
          },
          { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
        );
      },

      // Agregar un producto o sumarle cantidad si ya existe
      agregarProducto: (nuevoProd) => set((state) => {
        const existe = state.lista.find((p) => p.id === nuevoProd.id);
        if (existe) {
          return {
            lista: state.lista.map((p) =>
              p.id === nuevoProd.id ? { ...p, cantidad: p.cantidad + 1 } : p
            ),
          };
        }
        // Corregido: Eliminado el "quantity: 1" intruso
        return { lista: [...state.lista, { ...nuevoProd, cantidad: 1 }] };
      }),

      // Eliminar por ID
      eliminarProducto: (id) => set((state) => ({
        lista: state.lista.filter((p) => p.id !== id),
      })),

      // Modificar cantidad desde el input de la lista
      actualizarCantidad: (id, cantidad) => set((state) => ({
        lista: state.lista.map((p) =>
          p.id === id ? { ...p, cantidad: Math.max(1, cantidad) } : p
        ),
      })),

      // Vaciar el carrito
      limpiarLista: () => set({ lista: [] }),

      // Cambiar radio
      cambiarRadioBusqueda: (nuevoRadio) => set((state) => ({
        ubicacion: { ...state.ubicacion, radioBusqueda: nuevoRadio }
      })),

      // Guardar los parámetros geográficos manualmente
      setUbicacion: (nuevaUbi) => set({ ubicacion: nuevaUbi }),
    }),
    {
      name: 'lalista-storage',
    }
  )
);