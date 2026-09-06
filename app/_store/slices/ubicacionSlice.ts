import { StateCreator } from 'zustand';
import type { StoreState } from '../store';

export interface UbicacionUsuario {
  latitud: number | null;
  longitud: number | null;
  precision: number | null;     // En metros
  radioBusqueda: number;
  nombreLugar: string | null;   // Ej: "Ituzaingó, Buenos Aires"
  cargandoUbicacion: boolean;   // Para mostrar un spinner visual
}

export interface SucursalCercana {
  id_unico: string;
  id_comercio: number;
  id_bandera: number;
  comercio_bandera_nombre: string;
  sucursales_calle: string;
  sucursales_numero: string;
  distancia_metros: number;
}

export interface UbicacionSlice {
  ubicacion: UbicacionUsuario;
  
  sucursalesCercanas: SucursalCercana[];
  sucursalesIds: string[];
  cargandoSucursales: boolean;

  cambiarRadioBusqueda: (nuevoRadio: number) => void;
  setUbicacion: (ubicacion: UbicacionUsuario) => void;
  obtenerGpsNavegador: () => void;

  setSucursalesCercanas: (sucursales: SucursalCercana[]) => void;
  setCargandoSucursales: (cargando: boolean) => void;
}

export const createUbicacionSlice: StateCreator<StoreState, [], [], UbicacionSlice> = (set, get) => ({
  ubicacion: { 
    latitud: null, 
    longitud: null, 
    precision: null, 
    radioBusqueda: 3,
    nombreLugar: null,
    cargandoUbicacion: false 
  },

  cambiarRadioBusqueda: (nuevoRadio) => set((state) => ({
    ubicacion: { ...state.ubicacion, radioBusqueda: nuevoRadio }
  })),

  setUbicacion: (nuevaUbi) => set({ ubicacion: nuevaUbi }),

  obtenerGpsNavegador: () => {
    set((state) => ({ ubicacion: { ...state.ubicacion, cargandoUbicacion: true } }));

    if (typeof window === 'undefined' || !navigator.geolocation) {
      alert("Tu navegador no soporta geolocalización o estás en el servidor.");
      set((state) => ({ ubicacion: { ...state.ubicacion, cargandoUbicacion: false } }));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (posicion) => {
        const radioActual = get().ubicacion.radioBusqueda;
        set({
          ubicacion: {
            latitud: posicion.coords.latitude,
            longitud: posicion.coords.longitude,
            precision: posicion.coords.accuracy,
            radioBusqueda: radioActual,
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

  sucursalesCercanas: [],
  sucursalesIds: [],
  cargandoSucursales: false,

  setSucursalesCercanas: (sucursales) => 
    set({ 
      sucursalesCercanas: sucursales,
      sucursalesIds: sucursales.map((s) => s.id_unico)
    }),

  setCargandoSucursales: (cargando) => 
    set({ cargandoSucursales: cargando }),
});