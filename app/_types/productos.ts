export interface Sucursal {
  cadena: string;
  direccion: string;
  precio: number;
  id_comercio: number;
  id_bandera: number;
  distancia?: number | null;
  latitud?: number | null;
  longitud?: number | null;
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