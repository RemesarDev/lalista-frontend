/**
 * Coincidencias entre productos del changuito y los "genéricos" que
 * publica el INDEC (Cuadro 20 del informe técnico del IPC — precios
 * reales de una selección de ~50 alimentos y artículos para el GBA).
 * Es un match por USO/categoría, no por marca — por eso cada entrada
 * aclara qué tan directo es el match, para no comparar cosas que no
 * corresponden (ej: aceite de cocina vs. aceite de auto).
 */
export interface CoincidenciaIndec {
  /** Palabras clave (sin acentos, minúsculas) que identifican esta categoría en el nombre del producto. */
  claves: string[];
  serieId: string;
  nombreGenerico: string;
  /** Aclaración a mostrar cuando el match es una aproximación, no un match exacto de marca. */
  aclaracion?: string;
}

export const COINCIDENCIAS_INDEC: CoincidenciaIndec[] = [
  {
    claves: ['aceite'],
    serieId: '105.1_I2AG_2016_M_23',
    nombreGenerico: 'Aceite de girasol',
    aclaracion: 'El INDEC solo publica aceite de girasol — se usa como referencia para aceites de cocina en general, no es tu marca exacta.',
  },
  { claves: ['arroz'], serieId: '105.1_I2ABS_2016_M_28', nombreGenerico: 'Arroz blanco simple' },
  { claves: ['azucar'], serieId: '105.1_I2A_2016_M_15', nombreGenerico: 'Azúcar' },
  { claves: ['banana'], serieId: '105.1_I2B_2016_M_15', nombreGenerico: 'Banana' },
  { claves: ['cebolla'], serieId: '105.1_I2CE_2016_M_16', nombreGenerico: 'Cebolla' },
  { claves: ['naranja'], serieId: '105.1_I2N_2016_M_16', nombreGenerico: 'Naranja' },
  { claves: ['limon'], serieId: '105.1_I2L_2016_M_14', nombreGenerico: 'Limón' },
  { claves: ['papa'], serieId: '105.1_I2P_2016_M_13', nombreGenerico: 'Papa' },
  { claves: ['batata'], serieId: '105.1_I2BAT_2016_M_15', nombreGenerico: 'Batata' },
  { claves: ['yerba'], serieId: '105.1_I2YM_2016_M_19', nombreGenerico: 'Yerba mate' },
  { claves: ['cafe'], serieId: '105.1_I2CM_2016_M_20', nombreGenerico: 'Café molido' },
  {
    claves: ['gaseosa', 'cola'],
    serieId: '105.1_I2GBC_2016_M_26',
    nombreGenerico: 'Gaseosa base cola',
    aclaracion: 'El INDEC solo publica gaseosa base cola — se usa como referencia para gaseosas en general.',
  },
  { claves: ['cerveza'], serieId: '105.1_I2CB_2016_M_24', nombreGenerico: 'Cerveza en botella' },
  { claves: ['agua mineral', 'agua sin gas'], serieId: '105.1_I2ASG_2016_M_21', nombreGenerico: 'Agua sin gas' },
  { claves: ['desodorante'], serieId: '105.1_I2D_2016_M_20', nombreGenerico: 'Desodorante' },
  { claves: ['lavandina'], serieId: '105.1_I2L_2016_M_18', nombreGenerico: 'Lavandina' },
  { claves: ['algodon'], serieId: '105.1_I2A_2016_M_16', nombreGenerico: 'Algodón' },
  { claves: ['asado'], serieId: '105.1_I2A_2016_M_14', nombreGenerico: 'Asado' },
  { claves: ['nalga'], serieId: '105.1_I2N_2016_M_14', nombreGenerico: 'Nalga' },
  { claves: ['paleta'], serieId: '105.1_I2P_2016_M_15', nombreGenerico: 'Paleta' },
  { claves: ['salame'], serieId: '105.1_I2S_2016_M_15', nombreGenerico: 'Salame' },
  { claves: ['salchichon'], serieId: '105.1_I2S_2016_M_19', nombreGenerico: 'Salchichón' },
  { claves: ['tomate'], serieId: '105.1_I2TR_2016_M_23', nombreGenerico: 'Tomate redondo' },
  {
    claves: ['carne picada', 'carne molida'],
    serieId: '105.1_I2CPC_2016_M_27',
    nombreGenerico: 'Carne picada común',
  },
];

function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

/** Busca, por nombre de producto, si hay una categoría genérica del INDEC
 * que le corresponda (match por palabra clave, no por marca exacta). */
export function buscarCoincidenciaIndec(nombreProducto: string): CoincidenciaIndec | null {
  const normalizado = normalizar(nombreProducto);
  return (
    COINCIDENCIAS_INDEC.find((c) => c.claves.some((clave) => normalizado.includes(normalizar(clave)))) ?? null
  );
}