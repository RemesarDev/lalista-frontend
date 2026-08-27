export const formatearPrecio = (precio: number): string => {
  return new Intl.NumberFormat('es-AR', {
    maximumFractionDigits: 0
  }).format(precio);
};

export const formatearNombreProducto = (texto: string): string => {
  if (!texto) return '';
  return texto
    .toLowerCase()
    .split(' ')
    .map(palabra => palabra.charAt(0).toUpperCase() + palabra.slice(1))
    .join(' ');
};

export function formatearDistancia(distanciaKm?: number | null): string | null {
  if (distanciaKm == null || isNaN(distanciaKm)) return null;

  if (distanciaKm < 1) {
    // Si es menor a 1 km, lo mostramos en metros (ej: 450 m)
    const metros = Math.round(distanciaKm * 1000);
    return `${metros} m`;
  }

  // Si es 1 km o más, mostramos 1 o 2 decimales según preferencia (ej: 2.3 km)
  return `${distanciaKm.toFixed(1)} km`;
}