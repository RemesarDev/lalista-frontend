import type { ItemLista, OpcionProducto } from '@/app/_types/listas';
import { formatearNombreParaCompartir } from './formatters';
import { obtenerNombreComunGrupo } from './obtenerNombreComunGrupo';

const TITULO_POR_DEFECTO = 'Lista de compras';
const MARCA_PRINCIPAL = '★';
const MARCA_ALTERNATIVA = 'Alt:';

// Unidades a comprar de una opción. Mismo criterio que la comparativa:
// cantidad del ítem × unidades de esa opción.
const unidadesAComprar = (cantidadItem: number, opcion: OpcionProducto): number =>
  (cantidadItem || 1) * (opcion.cantidadOpcion || 1);

// La principal va primero. Si ninguna viene marcada se respeta el orden,
// porque en la app la principal es siempre la primera opción.
const ordenarPrincipalPrimero = (opciones: OpcionProducto[]): OpcionProducto[] => {
  const indicePrincipal = opciones.findIndex((opcion) => opcion.esPrincipal);
  if (indicePrincipal <= 0) return opciones;
  return [
    opciones[indicePrincipal],
    ...opciones.slice(0, indicePrincipal),
    ...opciones.slice(indicePrincipal + 1),
  ];
};

// Si la opción repite al principio el nombre del ítem, se lo saca para no
// repetirlo en cada línea: "Leche Chocolatada Cindor 1 L" → "Cindor 1 L".
const quitarNombreItem = (nombreOpcion: string, nombreItem: string): string => {
  const palabrasOpcion = nombreOpcion.split(' ');
  const palabrasItem = nombreItem.split(' ').filter(Boolean);
  if (!palabrasItem.length || palabrasItem.length >= palabrasOpcion.length) return nombreOpcion;

  const empiezaIgual = palabrasItem.every(
    (palabra, i) => palabra.toLowerCase() === palabrasOpcion[i].toLowerCase()
  );
  return empiezaIgual ? palabrasOpcion.slice(palabrasItem.length).join(' ') : nombreOpcion;
};

/**
 * Arma el texto plano que se comparte por WhatsApp / compartir nativo / copiar.
 *
 * 🛒 Desayunos
 *
 * Aceite Nucete Light 180 g x1
 *
 * Leche Chocolatada x1
 *     ★ Cindor 1 L (1 u.)
 *     Alt: Las Tres Niñas 500 ml (1 u.)
 *     Alt: Nescao 185 ml (3 u.)
 */
export function generarTextoLista(items: ItemLista[], nombreLista?: string | null): string {
  const titulo = nombreLista?.trim() || TITULO_POR_DEFECTO;

  const bloques = items.map((item) => {
    const opciones = ordenarPrincipalPrimero(item.opciones);
    const nombreItem = formatearNombreParaCompartir(
      item.nombrePersonalizado ?? obtenerNombreComunGrupo(opciones)
    );

    // Ítem sin alternativas: una sola línea con el total de unidades.
    if (opciones.length <= 1) {
      const unidades = opciones[0] ? unidadesAComprar(item.cantidad, opciones[0]) : item.cantidad;
      return `${nombreItem} x${unidades}`;
    }

    const lineasOpciones = opciones.map((opcion, i) => {
      const marca = i === 0 ? MARCA_PRINCIPAL : MARCA_ALTERNATIVA;
      const nombre = quitarNombreItem(formatearNombreParaCompartir(opcion.nombre), nombreItem);
      return `\t${marca} ${nombre} (${unidadesAComprar(item.cantidad, opcion)} u.)`;
    });

    return [`${nombreItem} x${item.cantidad}`, ...lineasOpciones].join('\n');
  });

  return [`🛒 ${titulo}`, ...bloques].join('\n\n');
}
