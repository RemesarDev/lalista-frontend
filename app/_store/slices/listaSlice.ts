import { StateCreator } from 'zustand';
import type { StoreState } from '../store';

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

export interface ProductoLista {
  id: string;        // ID único del producto (viene del SEPA / Supabase)
  nombre: string;    // Nombre del producto (ej: "Leche Entera 1L")
  url_imagen: string | null;
  cantidad: number;  // Cuántas unidades lleva el usuario
  sucursales: SucursalBusqueda[];  // Precios en sucursales (con TTL de 1 día)
  actualizadoEn: number;  // Timestamp para validar caché (en ms)
}

export interface CacheBusquedaPrecios {
  query: string;
  latitud: number | null;
  longitud: number | null;
  radioBusqueda: number;
  productos: ProductoBusqueda[];
  actualizadoEn: number;
}

const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 1 día en milisegundos

const esCacheValido = (timestamp: number): boolean => {
  return Date.now() - timestamp < CACHE_TTL_MS;
};

export interface ListaSlice {
  lista: ProductoLista[];
  cacheBusquedaPrecios: CacheBusquedaPrecios | null;
  terminoBusqueda: string;
  timeTerminoBusqueda: number;
  
  agregarProducto: (producto: Omit<ProductoLista, 'cantidad' | 'actualizadoEn'>) => void;
  eliminarProducto: (id: string) => void;
  actualizarCantidad: (id: string, cantidad: number) => void;
  limpiarLista: () => void;
  guardarCacheBusquedaPrecios: (cache: Omit<CacheBusquedaPrecios, 'actualizadoEn'>) => void;
  limpiarCacheBusquedaPrecios: () => void; 
  necesitaActualizarPreciosDeLista: () => boolean;
  setTerminoBusqueda: (termino: string) => void;
}

export const createListaSlice: StateCreator<StoreState, [], [], ListaSlice> = (set, get) => ({
  lista: [],
  cacheBusquedaPrecios: null,
  terminoBusqueda: "",
  timeTerminoBusqueda: 0,

  agregarProducto: (nuevoProd) => set((state) => {
    const existe = state.lista.find((p) => p.id === nuevoProd.id);
    const ahora = Date.now();
    
    if (existe) {
      if (esCacheValido(existe.actualizadoEn)) {
        return {
          lista: state.lista.map((p) =>
            p.id === nuevoProd.id ? { ...p, cantidad: p.cantidad + 1 } : p
          ),
        };
      }
      return {
        lista: state.lista.map((p) =>
          p.id === nuevoProd.id 
            ? { ...p, cantidad: p.cantidad + 1, sucursales: nuevoProd.sucursales, actualizadoEn: ahora }
            : p
        ),
      };
    }
    return { lista: [...state.lista, { ...nuevoProd, cantidad: 1, actualizadoEn: ahora }] };
  }),

  eliminarProducto: (id) => set((state) => ({
    lista: state.lista.filter((p) => p.id !== id),
  })),

  actualizarCantidad: (id, cantidad) => set((state) => ({
    lista: state.lista.map((p) =>
      p.id === id ? { ...p, cantidad: Math.max(1, cantidad) } : p
    ),
  })),

  limpiarLista: () => set({ lista: [] }),

  guardarCacheBusquedaPrecios: (cache) => set({
    cacheBusquedaPrecios: {
      ...cache,
      actualizadoEn: Date.now(),
    },
  }),

  limpiarCacheBusquedaPrecios: () => set({ cacheBusquedaPrecios: null }),
  
  necesitaActualizarPreciosDeLista: () => {
    const { lista } = get();
    return lista.some((prod) => !esCacheValido(prod.actualizadoEn));
  },

  setTerminoBusqueda: (termino) => set({
    terminoBusqueda: termino,
    timeTerminoBusqueda: Date.now()
  }),
});