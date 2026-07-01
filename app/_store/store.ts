import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// 1. Definimos las estructuras de datos (Types)
export interface ProductoLista {
  id: string;         // ID único del producto (viene del SEPA / Supabase)
  nombre: string;     // Nombre del producto (ej: "Leche Entera 1L")
  url_imagen: string | null;
  cantidad: number;   // Cuántas unidades lleva el usuario
  sucursales: SucursalBusqueda[];  // Precios en sucursales (con TTL de 1 día)
  actualizadoEn: number;  // Timestamp para validar caché (en ms)
}

const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 1 día en milisegundos

const esCacheValido = (timestamp: number): boolean => {
  return Date.now() - timestamp < CACHE_TTL_MS;
};

export interface SucursalBusqueda {
  cadena: string;
  direccion: string;
  precio: number;
  id_comercio: number;
  id_bandera: number;
}

export interface ProductoBusqueda {
  id: string;
  nombre: string;
  precioMinimo: number | null;
  sucursales: SucursalBusqueda[];
  url_imagen: string | null;
}

export interface CacheBusquedaPrecios {
  query: string;
  latitud: number | null;
  longitud: number | null;
  radioBusqueda: number;
  productos: ProductoBusqueda[];
  actualizadoEn: number;
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
  cacheBusquedaPrecios: CacheBusquedaPrecios | null;
  terminoBusqueda:string;
  setTerminoBusqueda: (termino: string) => void;
  timeTerminoBusqueda: number;
  
  // Acciones (Funciones para modificar el estado)
  agregarProducto: (producto: Omit<ProductoLista, 'cantidad' | 'actualizadoEn'>) => void;
  eliminarProducto: (id: string) => void;
  actualizarCantidad: (id: string, cantidad: number) => void;
  limpiarLista: () => void;
  cambiarRadioBusqueda: (nuevoRadio: number) => void;
  setUbicacion: (ubicacion: UbicacionUsuario) => void;
  obtenerGpsNavegador: () => void;
  guardarCacheBusquedaPrecios: (cache: Omit<CacheBusquedaPrecios, 'actualizadoEn'>) => void;
  limpiarCacheBusquedaPrecios: () => void;  necesitaActualizarPreciosDeLista: () => boolean;}

// 2. Creamos el Store con Persistencia Automática
export const useListaStore = create<ListaState>()(
  persist(
    (set, get) => ({
      // Estado inicial unificado
      lista: [],
      terminoBusqueda:"",
      timeTerminoBusqueda: 0,
      setTerminoBusqueda: (termino) => set({ 
        terminoBusqueda: termino,
        timeTerminoBusqueda: Date.now() 
      }),
      ubicacion: { 
        latitud: null, 
        longitud: null, 
        precision: null, 
        radioBusqueda: 3,
        nombreLugar: null,
        cargandoUbicacion: false 
      },
      cacheBusquedaPrecios: null,

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
        const ahora = Date.now();
        
        if (existe) {
          // Si existe y la caché sigue válida, no actualices timestamp
          if (esCacheValido(existe.actualizadoEn)) {
            return {
              lista: state.lista.map((p) =>
                p.id === nuevoProd.id ? { ...p, cantidad: p.cantidad + 1 } : p
              ),
            };
          }
          // Si la caché expiró, actualiza los precios (que vienen en nuevoProd.sucursales)
          return {
            lista: state.lista.map((p) =>
              p.id === nuevoProd.id 
                ? { ...p, cantidad: p.cantidad + 1, sucursales: nuevoProd.sucursales, actualizadoEn: ahora }
                : p
            ),
          };
        }
        // Nuevo producto
        return { lista: [...state.lista, { ...nuevoProd, cantidad: 1, actualizadoEn: ahora }] };
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

      // Cachear el último resultado de búsqueda para reutilizarlo en comparativa
      guardarCacheBusquedaPrecios: (cache) => set({
        cacheBusquedaPrecios: {
          ...cache,
          actualizadoEn: Date.now(),
        },
      }),

      limpiarCacheBusquedaPrecios: () => set({ cacheBusquedaPrecios: null }),
      
      // Helper para validar si caché de lista expiró
      necesitaActualizarPreciosDeLista: () => {
        const { lista } = get();
        // Retorna true si algún producto tiene caché expirada
        return lista.some((prod) => !esCacheValido(prod.actualizadoEn));
      },
    }),
    {
      name: 'lalista-storage',
    }
  )
);
