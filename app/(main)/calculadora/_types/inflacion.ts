// Tipos compartidos por la sección "Calculadora de inflación".

/** Un punto de una serie: fecha (día 1 de cada mes) + % acumulado desde la fecha base. */
export interface PuntoSerie {
  fecha: string; // formato ISO 'YYYY-MM-DD'
  porcentaje: number; // % acumulado respecto del primer punto de la serie (que vale 0)
}

export interface SerieInflacion {
  /** Identifica la serie: la clave del supermercado ("idComercio-idBandera") o 'indec'. */
  id: string;
  nombre: string;
  /** Variable CSS del tema (ej: 'var(--color-accent-600)') para reusar los colores ya definidos en globals.css */
  color: string;
  estiloLinea: 'solido' | 'punteado';
  puntos: PuntoSerie[];
  visible: boolean;
}