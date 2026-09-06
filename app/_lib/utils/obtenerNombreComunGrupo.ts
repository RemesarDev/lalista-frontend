// @/app/_lib/utils/formatters.ts

import { formatearNombre } from './formatters';

interface OpciónProducto {
  nombre: string;
}

export function obtenerNombreComunGrupo(opciones: OpciónProducto[]): string {
  if (!opciones || opciones.length === 0) return 'Producto';

  if (opciones.length === 1) {
    return formatearNombre(opciones[0].nombre);
  }

  // Conectores a ignorar
  const palabrasIgnoradas = new Set([
    'de', 'del', 'con', 'en', 'para', 'por', 'sin', 'y', 'e', 'o',
    'la', 'el', 'las', 'los', 'un', 'una', 'unos', 'unas'
  ]);

  // Metadatos y unidades a ignorar
  const metadatosIgnorados = new Set([
    'disc:disc', 'disc', 'pet', 'regular', 'pack', 'paq', 'caja', 'cja',
    'bot', 'botella', 'un', 'uni', 'unidad', 'lt', 'l', 'ml', 'cc', 'gr',
    'grs', 'g', 'kg', 'x', 'uat', 'grm'
  ]);

  const limpiarPalabras = (texto: string): string[] => {
    return texto
      .replace(/[,.-]/g, ' ')
      .trim()
      .split(/\s+/)
      .filter((p) => {
        const pLower = p.toLowerCase();
        return !metadatosIgnorados.has(pLower) && !/^\d+$/.test(pLower);
      });
  };

  // -------------------------------------------------------------
  // 1. PALABRAS COMUNES (Si comparten al menos 1 término relevante)
  // -------------------------------------------------------------
  const conteoPalabras = new Map<string, { textoOriginal: string; cuenta: number }>();

  opciones.forEach((opcion) => {
    const palabras = limpiarPalabras(opcion.nombre);
    const palabrasUnicasEnOpcion = new Set(
      palabras
        .map((p) => p.toLowerCase())
        .filter((p) => !palabrasIgnoradas.has(p) && p.length > 1)
    );

    palabrasUnicasEnOpcion.forEach((palabraLimpia) => {
      const varianteEncontrada =
        palabras.find((p) => p.toLowerCase() === palabraLimpia) || palabraLimpia;

      const actual = conteoPalabras.get(palabraLimpia) || {
        textoOriginal: varianteEncontrada,
        cuenta: 0,
      };

      conteoPalabras.set(palabraLimpia, {
        textoOriginal: actual.textoOriginal,
        cuenta: actual.cuenta + 1,
      });
    });
  });

  const totalOpciones = opciones.length;

  // Palabras presentes en la mayoría de las opciones (>= 50%)
  const palabrasRepresentativas = Array.from(conteoPalabras.values())
    .filter((item) => item.cuenta >= Math.ceil(totalOpciones / 2))
    .map((item) => item.textoOriginal);

  // CASO A: Si hay al menos 1 palabra común (ej: "Fideos"), la devuelve directamente
  if (palabrasRepresentativas.length > 0) {
    return formatearNombre(palabrasRepresentativas.join(' '));
  }

  // -------------------------------------------------------------
  // 2. SIN COINCIDENCIAS: COMBINACIÓN DE PRIMERAS 2 PALABRAS (MÁX 3 CON " / ")
  // -------------------------------------------------------------
  const LIMITE_ELEMENTOS = 3;
  const hayMasOpciones = opciones.length > LIMITE_ELEMENTOS;

  const opcionesLimitadas = opciones.slice(0, LIMITE_ELEMENTOS);

  const opcionesProcesadas = opcionesLimitadas.map((opcion) => {
    const palabrasUtiles = limpiarPalabras(opcion.nombre);
    return palabrasUtiles.slice(0, 2).join(' ');
  });

  const opcionesUnicas: string[] = [];
  opcionesProcesadas.forEach((item) => {
    const itemLower = item.toLowerCase();
    if (item && !opcionesUnicas.some((e) => e.toLowerCase() === itemLower)) {
      opcionesUnicas.push(item);
    }
  });

  const resultadoCombinado = opcionesUnicas
    .map((fragmento) => formatearNombre(fragmento))
    .join(' - ');

  return hayMasOpciones ? `${resultadoCombinado} ...` : resultadoCombinado;
}