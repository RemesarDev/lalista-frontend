/**
 * Códigos de provincia (norma ISO 3166-2:AR) — la tabla
 * `sepa_precios_historico_mensual` de Supabase guarda el histórico de
 * precios por provincia con este mismo formato ("AR-B", "AR-X", etc.),
 * así que necesitamos convertir el nombre de lugar que ya tenemos
 * (`ubicacion.nombreLugar`, ej: "Ituzaingó, Buenos Aires") a ese código
 * para poder cruzar los datos.
 *
 * El orden importa: "Ciudad Autónoma de Buenos Aires" se revisa ANTES que
 * "Buenos Aires" a secas, porque el nombre de CABA también contiene las
 * palabras "Buenos Aires" — si se revisara al revés, CABA siempre
 * matchearía como provincia de Buenos Aires por error.
 */
const PROVINCIAS_ARGENTINA: Array<[string[], string]> = [
  [['ciudad autonoma de buenos aires', 'caba', 'capital federal'], 'AR-C'],
  [['buenos aires'], 'AR-B'],
  [['catamarca'], 'AR-K'],
  [['chaco'], 'AR-H'],
  [['chubut'], 'AR-U'],
  [['cordoba'], 'AR-X'],
  [['corrientes'], 'AR-W'],
  [['entre rios'], 'AR-E'],
  [['formosa'], 'AR-P'],
  [['jujuy'], 'AR-Y'],
  [['la pampa'], 'AR-L'],
  [['la rioja'], 'AR-F'],
  [['mendoza'], 'AR-M'],
  [['misiones'], 'AR-N'],
  [['neuquen'], 'AR-Q'],
  [['rio negro'], 'AR-R'],
  [['salta'], 'AR-A'],
  [['san juan'], 'AR-J'],
  [['san luis'], 'AR-D'],
  [['santa cruz'], 'AR-Z'],
  [['santa fe'], 'AR-S'],
  [['santiago del estero'], 'AR-G'],
  [['tierra del fuego'], 'AR-V'],
  [['tucuman'], 'AR-T'],
];

function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/** Busca, dentro de un nombre de lugar libre (ej: "Ituzaingó, Buenos Aires"),
 * a qué provincia argentina corresponde, y devuelve su código ISO
 * (ej: "AR-B"). Devuelve null si no se pudo determinar. */
export function obtenerCodigoProvincia(nombreLugar: string | null): string | null {
  if (!nombreLugar) return null;
  const normalizado = normalizar(nombreLugar);

  for (const [claves, codigo] of PROVINCIAS_ARGENTINA) {
    if (claves.some((clave) => normalizado.includes(clave))) {
      return codigo;
    }
  }
  return null;
}