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

  // Words to ignore when calculating common word averages
  const palabrasIgnoradas = new Set([
    'de', 'del', 'con', 'en', 'para', 'por', 'sin', 'y', 'e', 'o',
    'la', 'el', 'las', 'los', 'un', 'una', 'unos', 'unas'
  ]);

  // Metadatos o basura común que arruina la extracción de palabras
  const metadatosIgnorados = new Set([
    'disc:disc', 'disc', 'pet', 'regular', 'pack', 'un', 'uni', 'unidad'
  ]);

  // -------------------------------------------------------------
  // 1. PROMEDIO DE PALABRAS COMUNES
  // -------------------------------------------------------------
  const conteoPalabras = new Map<string, { textoOriginal: string; cuenta: number }>();

  opciones.forEach((opcion) => {
    const palabras = opcion.nombre.trim().split(/\s+/);
    const palabrasUnicasEnOpcion = new Set(
      palabras.map((p) => p.toLowerCase()).filter((p) => !metadatosIgnorados.has(p))
    );

    palabrasUnicasEnOpcion.forEach((palabraLimpia) => {
      if (palabrasIgnoradas.has(palabraLimpia) || palabraLimpia.length <= 1) return;

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

  // Filtrar palabras que aparecen en al menos la mitad de las opciones
  const palabrasRepresentativas = Array.from(conteoPalabras.values())
    .filter((item) => item.cuenta >= Math.ceil(totalOpciones / 2))
    .map((item) => item.textoOriginal);

  // Si encontramos promedio / coincidencias representativas, las usamos
  if (palabrasRepresentativas.length > 0) {
    return formatearNombre(palabrasRepresentativas.join(' '));
  }

  // -------------------------------------------------------------
  // 2. SIN COINCIDENCIAS: COMBINACIÓN DE PRIMERAS 2 PALABRAS (MÁX 3 + ...)
  // -------------------------------------------------------------
  const LIMITE_ELEMENTOS = 3;
  const hayMasOpciones = opciones.length > LIMITE_ELEMENTOS;

  // Tomamos solo las primeras 3 opciones
  const opcionesLimitadas = opciones.slice(0, LIMITE_ELEMENTOS);

  const opcionesProcesadas = opcionesLimitadas.map((opcion) => {
    const palabrasUtiles = opcion.nombre
      .trim()
      .split(/\s+/)
      .filter((p) => !metadatosIgnorados.has(p.toLowerCase()));

    // Extrae las primeras 2 palabras
    return palabrasUtiles.slice(0, 2).join(' ');
  });

  // Eliminar duplicados manteniendo el orden
  const opcionesUnicas: string[] = [];
  opcionesProcesadas.forEach((item) => {
    const itemLower = item.toLowerCase();
    if (!opcionesUnicas.some((e) => e.toLowerCase() === itemLower)) {
      opcionesUnicas.push(item);
    }
  });

  // Unir con " / " y agregar "..." si superaba las 3 opciones
  const resultadoCombinado = opcionesUnicas
    .map((fragmento) => formatearNombre(fragmento))
    .join(' / ');

  return hayMasOpciones ? `${resultadoCombinado} ...` : resultadoCombinado;
}