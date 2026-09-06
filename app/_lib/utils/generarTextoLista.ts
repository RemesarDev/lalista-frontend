import type { ItemLista } from '@/app/_types/listas';
import { formatearNombreParaCompartir } from './formatters';
import { obtenerNombreComunGrupo } from './obtenerNombreComunGrupo';

export function generarTextoLista(items: ItemLista[]): string {
  const lineas = items.flatMap((item) => {
    const nombreComun = formatearNombreParaCompartir(obtenerNombreComunGrupo(item.opciones));
    const encabezado = item.opciones.length > 1
      ? `${nombreComun} x${item.cantidad} opciones:`
      : `${nombreComun} x${item.cantidad}`;

    const opciones = item.opciones.length > 1
      ? item.opciones.map((opcion) => `\t${formatearNombreParaCompartir(opcion.nombre)}`)
      : [];

    return [encabezado, ...opciones, ''];
  });

  return ['🛒 Lista de compras', '', ...lineas].join('\n').trim();
}