// app/_types/direcciones.ts

export interface DireccionGuardada {
  id: string;
  nombreLugar: string;
  latitud: number;
  longitud: number;
  radioBusqueda: number;
  esActiva: boolean;
  creadaEn: string;
}