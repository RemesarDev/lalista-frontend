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

// Abreviaturas de envase que vienen en los nombres del SEPA (Fco = frasco,
// Brk = brick, Ttb = tetra brik). No aportan nada al leer la lista.
const ENVASES = 'paq|pack|cja|caja|bot|botella|disc|fco|brk|brick|ttb';
const ENVASE_CON_TAMANIO = new RegExp(
  `\\b(?:${ENVASES})[-_ ]?(\\d+(?:[.,]\\d+)?)[-_ ]?(grs?|g|kg|mls?|lts?|l|cc)\\.?\\b`,
  'gi'
);
const ENVASE_SUELTO = new RegExp(`\\b(?:${ENVASES})\\b`, 'gi');
const TIENE_TAMANIO = /\d+(?:[.,]\d+)?\s*(?:kgs?|grs?|g|mls?|lts?|l|cc)\b/i;

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
    // "Brk-1000-ml", "Fco-180-g": si el nombre ya trae el tamaño en otro lado se
    // borra el bloque entero; si no, se conserva solo el tamaño ("1000 ml").
    .replace(ENVASE_CON_TAMANIO, (bloque, numero: string, unidad: string, inicio: number, completo: string) => {
      const resto = completo.slice(0, inicio) + completo.slice(inicio + bloque.length);
      return TIENE_TAMANIO.test(resto) ? ' ' : ` ${numero} ${unidad} `;
    })
    .replace(/\bx\s*(\d+(?:[.,]\d+)?)\s*(kg|grs?|g|ml|lt|l|cc)\b/gi, '$1 $2')
    .replace(/(\d+(?:[.,]\d+)?)\s*(kg|grs?|g|ml|lt|l|cc)\b/gi, '$1 $2')
    .replace(ENVASE_SUELTO, ' ');

  for (const [patron, reemplazo] of reemplazos) {
    nombre = nombre.replace(patron, reemplazo);
  }

  // Puntos y comas sueltos afuera, pero no los decimales ("2.25 l" no es "2 25 l").
  nombre = formatearNombre(nombre.replace(/(?<!\d)[.,]+|[.,]+(?!\d)/g, ' ').replace(/\s+/g, ' ').trim());

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