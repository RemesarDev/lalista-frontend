import { StateCreator } from 'zustand';
import type { StoreState } from '../store';
import type { DireccionGuardada } from '@/app/_types/direcciones';
import { fetchSucursalesCercanas } from '@/app/_lib/services/sucursalesService';
import { fetchDirecciones, agregarDireccion } from '@/app/_lib/services/direccionesService';
import { avisar, acortarNombre } from '@/app/_lib/avisos';

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
  lat: number;
  lng: number;
}

export interface UbicacionSlice {
  ubicacion: UbicacionUsuario;

  sucursalesCercanas: SucursalCercana[];
  sucursalesIds: string[];
  cargandoSucursales: boolean;

  direccionesGuardadas: DireccionGuardada[];
  cargarDirecciones: () => Promise<void>;
  limpiarDirecciones: () => void;
  /**
   * Al entrar o registrarse manda la cuenta: `cargarDirecciones` pisa la
   * ubicación con la dirección activa del usuario, como siempre. Si la cuenta
   * no tiene ninguna no hay nada con qué pisar, así que la quitamos igual y el
   * lugar que venía marcando queda sólo en una variable, para ofrecérselo.
   *
   * Que el default sea quitarla evita la dirección fantasma: un usuario con
   * cuenta tiene una dirección guardada o no tiene ninguna. Si quedaba suelta,
   * el header la mostraba, no estaba en ninguna cuenta y encima no se podía
   * borrar, porque el sheet no dibuja esa fila para logueados.
   *
   * Recibe la ubicación local por parámetro en vez de leerla del store porque
   * `cargarDirecciones` la pisa: el llamador saca la foto antes.
   */
  ofrecerConservarUbicacion: (local: UbicacionUsuario) => void;

  cambiarRadioBusqueda: (nuevoRadio: number) => void;
  setUbicacion: (ubicacion: UbicacionUsuario) => void;
  limpiarUbicacion: () => void;
  obtenerGpsNavegador: () => void;

  setSucursalesCercanas: (sucursales: SucursalCercana[]) => void;
  limpiarSucursales: () => void;
  setCargandoSucursales: (cargando: boolean) => void;
}

/**
 * `cargarDirecciones` corre desde muchos lados a la vez: el AuthProvider, el
 * checkAuth que montan mi-lista / mis-listas / perfil, el login y el sheet de
 * direcciones. Sin esto la respuesta de una carga vieja llega tarde y pisa lo
 * que ya dejó una más nueva, sin ningún error en consola.
 *
 * Va a nivel de módulo y no en el estado porque el `partialize` del store solo
 * omite `user` y `loadingAuth`: un contador en el estado se persistiría al pedo.
 */
let cargaDireccionesSeq = 0;

/** El ofrecimiento espera a que pase el saludo de bienvenida del login o registro. */
const DEMORA_OFRECIMIENTO_MS = 1200;

export const createUbicacionSlice: StateCreator<StoreState, [], [], UbicacionSlice> = (set, get) => ({
  ubicacion: {
    latitud: null,
    longitud: null,
    precision: null,
    radioBusqueda: 3,
    nombreLugar: null,
    cargandoUbicacion: false,
  },

  direccionesGuardadas: [],

  cargarDirecciones: async () => {
    const seq = ++cargaDireccionesSeq;
    const mapeadas = await fetchDirecciones();
    if (seq !== cargaDireccionesSeq || !mapeadas) return;

    set({ direccionesGuardadas: mapeadas });

    // Si hay una activa, la ponemos como ubicación actual y refrescamos sucursales
    const activa = mapeadas.find((d) => d.esActiva);
    if (activa) {
      set((state) => ({
        ubicacion: {
          ...state.ubicacion,
          latitud: activa.latitud,
          longitud: activa.longitud,
          nombreLugar: activa.nombreLugar,
          radioBusqueda: activa.radioBusqueda,
        },
      }));

      // Sin esto, sucursalesCercanas queda stale del localStorage y la comparativa falla
      const sucursales = await fetchSucursalesCercanas(activa.latitud, activa.longitud, activa.radioBusqueda);
      if (seq !== cargaDireccionesSeq) return;
      if (sucursales) get().setSucursalesCercanas(sucursales);
    }
  },

  limpiarDirecciones: () => {
    // Invalida las cargas en vuelo: si no, una que salió con la sesión todavía
    // viva vuelve a escribir las direcciones de la cuenta que se acaba de cerrar.
    cargaDireccionesSeq++;
    set({
      direccionesGuardadas: [],
      sucursalesCercanas: [],
      sucursalesIds: [],
    });
  },

  ofrecerConservarUbicacion: (local) => {
    // Un logout pudo ganar la carrera mientras resolvía el login.
    if (!get().user) return;
    if (local.latitud === null || local.longitud === null || !local.nombreLugar) return;

    // Solo cuando la cuenta está vacía. Si ya tiene direcciones, las suyas
    // mandan y `cargarDirecciones` ya dejó puesta la activa.
    if (get().direccionesGuardadas.length > 0) return;

    const { latitud, longitud, nombreLugar, radioBusqueda } = local;
    const nombreCorto = acortarNombre(nombreLugar, 30);

    // Con la cuenta vacía `cargarDirecciones` no tuvo con qué pisar la
    // ubicación, así que la quitamos nosotros. A partir de acá el lugar existe
    // sólo en este closure: si no toca el botón, no hay nada que limpiar
    // después ni dirección fantasma en el header.
    get().limpiarUbicacion();

    setTimeout(() => {
      avisar.conAccion(`Podés guardar ${nombreCorto} en tu cuenta`, {
        etiqueta: 'Guardar',
        onClick: async () => {
          // El POST exige radio entre 1 y 10; un estado persistido viejo podría
          // traer otro valor y devolver un 400 que se coma el guardado.
          const radio = Math.min(10, Math.max(1, Math.round(radioBusqueda)));

          const { ok } = await agregarDireccion(nombreLugar, latitud, longitud, radio);
          if (!ok) {
            avisar.error('No pudimos guardar tu dirección en la cuenta.');
            return;
          }

          // La trae de vuelta ya activa: al ser la primera de la cuenta,
          // `agregar_direccion` la marca activa, así que esto repone la
          // ubicación y las sucursales de una.
          await get().cargarDirecciones();
          avisar.exito(`Guardaste ${nombreCorto} en tu cuenta`);
        },
      });
    }, DEMORA_OFRECIMIENTO_MS);
  },

  cambiarRadioBusqueda: (nuevoRadio) => set((state) => ({
    ubicacion: { ...state.ubicacion, radioBusqueda: nuevoRadio }
  })),

  setUbicacion: (nuevaUbi) => set({ ubicacion: nuevaUbi }),

  /**
   * Deja al usuario sin lugar elegido. Conserva el radio: es una preferencia
   * suya, no parte de la dirección. También limpia las sucursales, porque una
   * ubicación vacía con sucursales viejas sigue filtrando precios de una zona
   * que ya no corresponde.
   */
  limpiarUbicacion: () => {
    // Igual que en limpiarDirecciones: invalida las cargas en vuelo.
    cargaDireccionesSeq++;
    set((state) => ({
      ubicacion: {
        ...state.ubicacion,
        latitud: null,
        longitud: null,
        nombreLugar: null,
        precision: null,
      },
    }));
    get().limpiarSucursales();
  },

  obtenerGpsNavegador: () => {
    set((state) => ({ ubicacion: { ...state.ubicacion, cargandoUbicacion: true } }));

    if (typeof window === 'undefined' || !navigator.geolocation) {
      avisar.error("Tu navegador no permite usar tu ubicación. Elegila a mano.");
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
        avisar.error("No pudimos obtener tu ubicación. Elegila a mano.");
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
      sucursalesIds: sucursales.map((s) => s.id_unico),
    }),

  // Sin esto las sucursales sobreviven en localStorage y siguen filtrando precios
  // de una ubicación que el usuario ya borró
  limpiarSucursales: () => set({ sucursalesCercanas: [], sucursalesIds: [] }),

  setCargandoSucursales: (cargando) =>
    set({ cargandoSucursales: cargando }),
});