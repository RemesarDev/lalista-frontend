// app/_lib/mappers/direcciones.ts
import type { DireccionGuardada } from '@/app/_types/direcciones';

export interface DbDireccion {
  id: string;
  user_id: string;
  nombre_lugar: string;
  latitud: number;
  longitud: number;
  radio_busqueda: number;
  es_activa: boolean;
  creada_en: string;
}

export const mapearDireccion = (raw: DbDireccion): DireccionGuardada => ({
  id: raw.id,
  nombreLugar: raw.nombre_lugar,
  latitud: raw.latitud,
  longitud: raw.longitud,
  radioBusqueda: raw.radio_busqueda,
  esActiva: raw.es_activa,
  creadaEn: raw.creada_en,
});