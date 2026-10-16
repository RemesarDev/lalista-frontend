import type { PromocionBancaria } from '@/app/api/[[...route]]/promociones';

const ZONA = 'America/Argentina/Buenos_Aires';

/** Fecha de hoy en Argentina, formato "año-mes-día" (ej: "2026-10-07"). */
export const hoyEnArgentinaISO = () =>
  new Intl.DateTimeFormat('en-CA', { timeZone: ZONA }).format(new Date());

/**
 * Fecha real del día elegido (1 = lunes ... 7 = domingo): la próxima vez
 * que cae ese día de la semana, contando hoy.
 */
export function fechaDelDiaElegido(dia: number): string {
  const hoy = hoyEnArgentinaISO();
  const fecha = new Date(`${hoy}T00:00:00Z`);
  const diaHoy = fecha.getUTCDay() === 0 ? 7 : fecha.getUTCDay();
  const diasQueFaltan = (dia - diaHoy + 7) % 7;
  fecha.setUTCDate(fecha.getUTCDate() + diasQueFaltan);
  return fecha.toISOString().slice(0, 10);
}

/** true si la promo ya empezó y todavía no venció en esa fecha. Si falta una fecha, no se filtra por ese lado. */
export function promoVigenteEnFecha(
  promo: Pick<PromocionBancaria, 'vigencia_desde' | 'vigencia_hasta'>,
  fecha: string,
): boolean {
  if (promo.vigencia_desde && promo.vigencia_desde > fecha) return false;
  if (promo.vigencia_hasta && promo.vigencia_hasta < fecha) return false;
  return true;
}