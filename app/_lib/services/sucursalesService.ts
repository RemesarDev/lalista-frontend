import type { SucursalCercana } from '@/app/_store/slices/ubicacionSlice';

export async function fetchSucursalesCercanas(
  lat: number,
  lng: number,
  radio: number
): Promise<SucursalCercana[] | null> {
  const res = await fetch(`/api/maps/sucursales-cercanas?lat=${lat}&lng=${lng}&radio=${radio}`);
  if (!res.ok) return null;
  const data = await res.json();
  return data.sucursales ?? null;
}
