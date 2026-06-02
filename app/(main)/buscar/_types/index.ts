// app/_types.ts
export interface Precio {
  cadena: string;
  direccion: string;
  precio: number;
}

export interface Producto {
  id: string; // O number, según tu DB
  nombre: string;
  precios: Precio[];
}

export interface BusquedaResponse {
  productos: Producto[];
}