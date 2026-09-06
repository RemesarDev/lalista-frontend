export const formatearPrecio = (precio: number): string => {
  return new Intl.NumberFormat('es-AR', {
    maximumFractionDigits: 0
  }).format(precio);
};

export const formatearNombre = (texto: string): string => {
  if (!texto) return '';
  return texto
    .toLowerCase()
    .split(' ')
    .map(palabra => palabra.charAt(0).toUpperCase() + palabra.slice(1))
    .join(' ');
};

export const formatearNombreParaCompartir = (texto: string): string => {
  if (!texto) return '';

  const reemplazos: Array<[RegExp, string]> = [
    [/\b(bco)\b/gi, 'blanco'],
    [/\b(pta)\b/gi, 'pasta'],
    [/\b(grs?|gramos?)\b/gi, 'g'],
    [/\b(kgs?|kilogramos?)\b/gi, 'kg'],
    [/\b(mls?|mililitros?)\b/gi, 'ml'],
    [/\b(lts?|litros?)\b/gi, 'l'],
  ];

  let nombre = texto
    .replace(/\b(?:paq|pack|cja|caja|bot|botella|disc)[-_]?\d+(?:[.,]\d+)?[-_]?(?:grs?|g|kg|ml|lt|l|cc)\.?\b/gi, ' ')
    .replace(/\bx\s*(\d+(?:[.,]\d+)?)\s*(kg|grs?|g|ml|lt|l|cc)\b/gi, '$1 $2')
    .replace(/(\d+(?:[.,]\d+)?)\s*(kg|grs?|g|ml|lt|l|cc)\b/gi, '$1 $2')
    .replace(/\b(paq|pack|cja|caja|bot|botella|disc)\b/gi, ' ');

  for (const [patron, reemplazo] of reemplazos) {
    nombre = nombre.replace(patron, reemplazo);
  }

  nombre = formatearNombre(nombre.replace(/[.,]+/g, ' ').replace(/\s+/g, ' ').trim());

  return nombre
    .replace(/\bG\b/g, 'g')
    .replace(/\bGrs?\b/g, 'g')
    .replace(/\bKg\b/g, 'kg')
    .replace(/\bMl\b/g, 'ml')
    .replace(/\bLt\b/g, 'l')
    .replace(/\bCc\b/g, 'ml');
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