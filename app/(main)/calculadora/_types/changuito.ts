export interface ProductoChanguito {
  id: string;
  nombre: string;
  urlImagen: string | null;
  cantidad: number;
}

export interface SupermercadoChanguito {
  clave: string;
  idComercio: number;
  idBandera: number;
  cadena: string;
  direccion: string;
}

export interface PuntoMensual {
  mes: string; // 'YYYY-MM'
  precioTotal: number;
}

export interface HistorialSupermercado {
  clave: string;
  puntos: PuntoMensual[];
}

export interface Changuito {
  id: string;
  nombre: string;
  fechaInicio: string;
  productos: ProductoChanguito[];
  supermercados: SupermercadoChanguito[];
  historialPorSupermercado: HistorialSupermercado[];
}