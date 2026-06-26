// app/_types.ts
export interface Sucursal {
  cadena: string;
  direccion: string;
  precio: number;
  id_comercio: number;
  id_bandera: number;
}

export interface Producto {
  id: string;
  nombre: string;
  precioMinimo: number | null;
  sucursales: Sucursal[];
  url_imagen: string | null;
}

export interface BusquedaResponse {
  productos: Producto[];
}
