// Color e iniciales de cada supermercado, para identificarlos en la interfaz.
// Son los mismos que usa el mapa (ubicacion/_components/IconosSupermercadas.ts),
// así cada cadena se ve igual en toda la app.

interface Identidad {
  color: string;
  iniciales: string;
}

const IDENTIDADES: Record<string, Identidad> = {
  coto: { color: '#E30613', iniciales: 'CO' },
  carrefour: { color: '#004E9F', iniciales: 'CA' },
  jumbo: { color: '#00A94F', iniciales: 'JU' },
  disco: { color: '#EE7203', iniciales: 'DI' },
  vea: { color: '#8DC63F', iniciales: 'VE' },
  changomas: { color: '#F5A800', iniciales: 'CM' },
  la_anonima: { color: '#005CA9', iniciales: 'LA' },
  default: { color: '#475569', iniciales: '?' },
};

const normalizar = (texto: string) =>
  texto.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

/** Blanco o negro, según qué se lee mejor sobre el color de fondo. */
const colorDeTexto = (hex: string) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 150 ? '#0f172a' : '#ffffff';
};

export function identidadSupermercado(nombre: string) {
  const n = normalizar(nombre);
  const clave =
    Object.keys(IDENTIDADES).find((k) => k !== 'default' && n.includes(k.replace('_', ' '))) ?? 'default';
  const { color, iniciales } = IDENTIDADES[clave];
  return { color, iniciales: clave === 'default' ? nombre.slice(0, 2).toUpperCase() : iniciales, colorTexto: colorDeTexto(color) };
}