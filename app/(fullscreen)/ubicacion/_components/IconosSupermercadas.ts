import L from 'leaflet';

interface ConfigBandera {
  color: string;
  iniciales: string;
}

const CONFIG_BANDERAS: Record<string, ConfigBandera> = {
  coto:               { color: '#E30613', iniciales: 'CO' },
  carrefour:          { color: '#004E9F', iniciales: 'CA' },
  jumbo:              { color: '#00A94F', iniciales: 'JU' },
  disco:              { color: '#EE7203', iniciales: 'DI' },
  vea:                { color: '#8DC63F', iniciales: 'VE' },
  changomas:          { color: '#F5A800', iniciales: 'CM' },
  dia:                { color: '#E4032E', iniciales: 'DI' },
  libertad:           { color: '#0072BC', iniciales: 'LI' },
  cooperativa_obrera: { color: '#6A1B9A', iniciales: 'CO' },
  comodin:            { color: '#F7941D', iniciales: 'CM' },
  la_anonima:         { color: '#005CA9', iniciales: 'LA' },
  farmacity:          { color: '#00A651', iniciales: 'FA' },
  toledo:             { color: '#D4145A', iniciales: 'TO' },
  mariano_max:        { color: '#1B75BC', iniciales: 'MM' },
  default:            { color: '#475569', iniciales: '?' },
};

// Elegimos un color de texto legible (blanco o negro) según el brillo del fondo
const obtenerColorTexto = (hex: string): string => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const brillo = (r * 299 + g * 587 + b * 114) / 1000;
  return brillo > 150 ? '#0f172a' : '#ffffff';
};

export const obtenerIconoSupermercado = (nombreBandera: string) => {
  const nombre = (nombreBandera || '').toLowerCase();

  let clave = 'default';

  if (nombre.includes('coto')) {
    clave = 'coto';
  } else if (nombre.includes('carrefour') || nombre.includes('market') || nombre.includes('express')) {
    clave = 'carrefour';
  } else if (nombre.includes('jumbo')) {
    clave = 'jumbo';
  } else if (nombre.includes('disco')) {
    clave = 'disco';
  } else if (nombre.includes('vea')) {
    clave = 'vea';
  } else if (nombre.includes('changomas') || nombre.includes('superchangomas')) {
    clave = 'changomas';
  } else if (nombre.includes('dia')) {
    clave = 'dia';
  } else if (nombre.includes('libertad')) {
    clave = 'libertad';
  } else if (nombre.includes('cooperativa obrera')) {
    clave = 'cooperativa_obrera';
  } else if (nombre.includes('comodin') || nombre.includes('maxi comodin')) {
    clave = 'comodin';
  } else if (nombre.includes('la anonima')) {
    clave = 'la_anonima';
  } else if (nombre.includes('farmacity') || nombre.includes('simplicity')) {
    clave = 'farmacity';
  } else if (nombre.includes('toledo')) {
    clave = 'toledo';
  } else if (nombre.includes('mariano max')) {
    clave = 'mariano_max';
  }

  const { color, iniciales } = CONFIG_BANDERAS[clave] ?? CONFIG_BANDERAS.default;
  const colorTexto = obtenerColorTexto(color);

  return L.divIcon({
    className: 'custom-super-marker',
    html: `
      <div 
        class="relative flex items-center justify-center w-9 h-9 rounded-full shadow-xl border-2 border-slate-900 transition-transform hover:scale-110 cursor-pointer"
        style="background-color: ${color};"
      >
        <span 
          class="text-[10px] font-bold leading-none select-none"
          style="color: ${colorTexto};"
        >
          ${iniciales}
        </span>
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -18],
  });
};