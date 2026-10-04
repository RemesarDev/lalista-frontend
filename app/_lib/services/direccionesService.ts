import type { DireccionGuardada } from '@/app/_types/direcciones';
import { mapearDireccion, type DbDireccion } from '@/app/_lib/mappers/direcciones';

export async function fetchDirecciones(): Promise<DireccionGuardada[] | null> {
  const res = await fetch('/api/direcciones');
  if (!res.ok) return null;
  const { direcciones } = await res.json() as { direcciones: DbDireccion[] };
  return direcciones.map(mapearDireccion);
}

export async function agregarDireccion(
  nombreLugar: string,
  latitud: number,
  longitud: number,
  radioBusqueda: number
): Promise<boolean> {
  const res = await fetch('/api/direcciones', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      nombre_lugar: nombreLugar,
      latitud,
      longitud,
      radio_busqueda: radioBusqueda,
    }),
  });
  return res.ok;
}

export async function activarDireccion(id: string): Promise<boolean> {
  const res = await fetch(`/api/direcciones/${id}/activar`, { method: 'PATCH' });
  return res.ok;
}

export async function actualizarRadioDireccion(id: string, radio: number): Promise<boolean> {
  const res = await fetch(`/api/direcciones/${id}/radio`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ radio_busqueda: radio }),
  });
  return res.ok;
}

export async function eliminarDireccion(id: string): Promise<boolean> {
  const res = await fetch(`/api/direcciones/${id}`, { method: 'DELETE' });
  return res.ok;
}
