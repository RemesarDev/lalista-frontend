import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';

interface VerUbicacionSucursalParams {
  router: AppRouterInstance;
  latitud?: number | null;
  longitud?: number | null;
  nombre?: string;
}

export const verUbicacionSucursal = ({
  router,
  latitud,
  longitud,
  nombre,
}: VerUbicacionSucursalParams) => {
  if (!latitud || !longitud) return;

  const queryParams = new URLSearchParams({
    sucursalLat: latitud.toString(),
    sucursalLng: longitud.toString(),
  });

  if (nombre) {
    queryParams.set('sucursalNombre', nombre);
  }

  router.push(`/ubicacion?${queryParams.toString()}`);
};