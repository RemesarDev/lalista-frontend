import { StateCreator } from 'zustand';
import type { StoreState } from '../store';

export interface SucursalBusqueda { //se recomienda a futuro importar esto de types
  cadena: string;
  direccion: string;
  precio: number;
  id_comercio: number;
  id_bandera: number;
  distancia?: number | null;
  latitud?: number | null;
  longitud?: number | null;
}

export interface ProductoBusqueda {//se recomienda a futuro importar esto de types
  id: string;
  nombre: string;
  precioMinimo: number | null;
  sucursales: SucursalBusqueda[];
  url_imagen: string | null;
}

// Representa un producto (sea el principal o una alternativa)
export interface ProductoOpcion {
  id: string;
  nombre: string;
  url_imagen: string | null;
  sucursales: SucursalBusqueda[];
  actualizadoEn: number;
}

// Representa un Grupo Disyuntivo en la lista (Canasta)
export interface GrupoLista {
  grupoId: string;           // ID único del grupo (ej: crypto.randomUUID())
  cantidad: number;          // Cantidad solicitada para el grupo
  comprado?: boolean;        // Estado de chequeo general
  opciones: ProductoOpcion[];// opciones[0] es la principal, 1..N son alternativas
}

export interface CacheBusquedaPrecios {
  query: string;
  latitud: number | null;
  longitud: number | null;
  radioBusqueda: number;
  productos: ProductoBusqueda[];
  actualizadoEn: number;
}

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

const esCacheValido = (timestamp: number): boolean => {
  return Date.now() - timestamp < CACHE_TTL_MS;
};

export interface ListaSlice {
  lista: GrupoLista[];
  cacheBusquedaPrecios: CacheBusquedaPrecios | null;
  terminoBusqueda: string;
  timeTerminoBusqueda: number;

  // Acciones de Grupo / Producto
  agregarProducto: (
    producto: Omit<ProductoOpcion, 'actualizadoEn'>,
    targetGrupoId?: string // Si viene, se agrega como ALTERNATIVA a este grupo
  ) => void;
  eliminarOpcion: (grupoId: string, productoId: string) => void;
  eliminarGrupo: (grupoId: string) => void;
  actualizarCantidadGrupo: (grupoId: string, cantidad: number) => void;
  toggleCompradoGrupo: (grupoId: string) => void;
  limpiarLista: () => void;

  // Métodos de caché y búsqueda
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

  agregarProducto: (nuevoProd, targetGrupoId) => set((state) => {
    const ahora = Date.now();
    const prodOpcion: ProductoOpcion = { ...nuevoProd, actualizadoEn: ahora };

    // CASO 1: Se agrega como ALTERNATIVA a un grupo existente
    if (targetGrupoId) {
      return {
        lista: state.lista.map((grupo) => {
          if (grupo.grupoId !== targetGrupoId) return grupo;

          // Si el producto ya existe dentro del grupo, no lo duplicamos
          const existeProd = grupo.opciones.some((p) => p.id === nuevoProd.id);
          if (existeProd) return grupo;

          return {
            ...grupo,
            opciones: [...grupo.opciones, prodOpcion],
          };
        }),
      };
    }

    // CASO 2: Agregar como NUEVO GRUPO (o incrementar si el producto principal ya existía como grupo principal)
    const grupoExistente = state.lista.find((g) => g.opciones[0]?.id === nuevoProd.id);

    if (grupoExistente) {
      return {
        lista: state.lista.map((g) =>
          g.grupoId === grupoExistente.grupoId
            ? { ...g, cantidad: g.cantidad + 1 }
            : g
        ),
      };
    }

    // Crear un nuevo grupo disyuntivo
    const nuevoGrupo: GrupoLista = {
      grupoId: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `grupo-${Date.now()}-${Math.random()}`,
      cantidad: 1,
      comprado: false,
      opciones: [prodOpcion],
    };

    return { lista: [...state.lista, nuevoGrupo] };
  }),

  // Elimina un producto específico (principal o alternativa). Si era la última opción, elimina el grupo.
  eliminarOpcion: (grupoId, productoId) => set((state) => ({
    lista: state.lista
      .map((g) => {
        if (g.grupoId !== grupoId) return g;
        return {
          ...g,
          opciones: g.opciones.filter((p) => p.id !== productoId),
        };
      })
      .filter((g) => g.opciones.length > 0), // Si no le quedan productos al grupo, se descarta
  })),

  eliminarGrupo: (grupoId) => set((state) => ({
    lista: state.lista.filter((g) => g.grupoId !== grupoId),
  })),

  actualizarCantidadGrupo: (grupoId, cantidad) => set((state) => ({
    lista: state.lista.map((g) =>
      g.grupoId === grupoId ? { ...g, cantidad: Math.max(1, cantidad) } : g
    ),
  })),

  toggleCompradoGrupo: (grupoId) => set((state) => ({
    lista: state.lista.map((g) =>
      g.grupoId === grupoId ? { ...g, comprado: !g.comprado } : g
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
    return lista.some((grupo) =>
      grupo.opciones.some((prod) => !esCacheValido(prod.actualizadoEn))
    );
  },

  setTerminoBusqueda: (termino) => set({
    terminoBusqueda: termino,
    timeTerminoBusqueda: Date.now(),
  }),
});