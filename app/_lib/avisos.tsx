import { toast } from 'sonner';
import { Aviso, type AccionAviso, type TipoAviso } from '@/app/_components/global/avisos/Aviso';

/**
 * Avisos flotantes (toasts): la confirmacion visual de que lo que hizo el
 * usuario tuvo efecto. No hay centro de notificaciones ni campanita: el aviso
 * aparece, confirma y se va solo.
 *
 * Cuando usarlos:
 * - Despues de que respondio la API (desde los _hooks, no desde la UI).
 * - Solo si el cambio NO se ve ya en pantalla. Si una cantidad sube o un boton
 *   pasa a "Guardado", el aviso sobra.
 * - Para borrar algo que se puede recuperar, mejor `deshacer` que un modal de
 *   "¿Estas seguro?".
 *
 * Como escribirlos: cortos, en voseo, en pasado y con nombres concretos.
 * "Borraste la lista Asado", no "Lista eliminada con exito".
 *
 * Duraciones: exito 3 s, con boton 4 a 6 s, errores quedan hasta cerrarlos.
 */

const DURACION = {
  corta: 3000,
  media: 4000,
  conDeshacer: 6000,
  conBoton: 6000,
  hastaCerrar: Infinity,
} as const;

interface OpcionesAviso {
  accion?: AccionAviso;
  duracion?: number;
  /** Mismo id = se actualiza el aviso que ya esta en pantalla en vez de sumar otro. */
  id?: string;
  /** Se llama cuando el aviso se va, solo o porque lo cerraron. */
  alCerrar?: () => void;
}

function mostrar(tipo: TipoAviso, mensaje: string, opciones: OpcionesAviso = {}) {
  const { accion, duracion = DURACION.corta, id, alCerrar } = opciones;
  const persistente = duracion === Infinity;

  return toast.custom(
    (idAviso) => (
      <Aviso
        tipo={tipo}
        mensaje={mensaje}
        accion={
          accion && {
            etiqueta: accion.etiqueta,
            onClick: () => {
              accion.onClick();
              toast.dismiss(idAviso);
            },
          }
        }
        onCerrar={persistente ? () => toast.dismiss(idAviso) : undefined}
      />
    ),
    { id, duration: duracion, onDismiss: alCerrar, onAutoClose: alCerrar }
  );
}

/** Recorta nombres largos (productos, direcciones) para que el aviso se lea entero. */
export function acortarNombre(texto: string, max = 32): string {
  const limpio = texto.trim();
  return limpio.length <= max ? limpio : `${limpio.slice(0, max - 1).trimEnd()}…`;
}

// Agregar productos es lo que mas se repite: en vez de un aviso por producto,
// hay uno solo que se va actualizando ("Agregaste 3 productos a tu lista").
const ID_PRODUCTOS_AGREGADOS = 'productos-agregados';
let productosAgregados = 0;

export const avisar = {
  /** Confirmacion de algo que salio bien. */
  exito: (mensaje: string, accion?: AccionAviso) =>
    mostrar('exito', mensaje, {
      accion,
      duracion: accion ? DURACION.media : DURACION.corta,
    }),

  /** Dato util que no es exito ni error (ej.: "Cerraste la lista..."). */
  info: (mensaje: string, duracion: number = DURACION.media) =>
    mostrar('info', mensaje, { duracion }),

  /** Algo se borro y se puede recuperar con "Deshacer". */
  deshacer: (mensaje: string, alDeshacer: () => void) =>
    mostrar('deshacer', mensaje, {
      accion: { etiqueta: 'Deshacer', onClick: alDeshacer },
      duracion: DURACION.conDeshacer,
    }),

  /**
   * Algo que pide cuenta. No navega: ofrece el camino y el usuario decide. Si
   * no toca "Entrar", se queda donde estaba.
   */
  invitarAEntrar: (mensaje: string, alEntrar: () => void) =>
    mostrar('info', mensaje, {
      accion: { etiqueta: 'Entrar', onClick: alEntrar },
      duracion: DURACION.conBoton,
    }),

  /**
   * Info con un boton propio. Para ofrecer algo que el usuario no pidio todavia
   * y que decide el: si no toca el boton, no pasa nada.
   */
  conAccion: (mensaje: string, accion: AccionAviso) =>
    mostrar('info', mensaje, {
      accion,
      duracion: DURACION.conBoton,
    }),

  /** Algo fallo. Queda hasta que lo cierran; si se puede, ofrece reintentar. */
  error: (mensaje: string, reintentar?: () => void) =>
    mostrar('error', mensaje, {
      accion: reintentar && { etiqueta: 'Reintentar', onClick: reintentar },
      duracion: DURACION.hastaCerrar,
    }),

  /** Producto sumado a la lista. Agrupa los que se agregan seguidos. */
  productoAgregado: (nombre: string, irALista?: () => void) => {
    productosAgregados += 1;
    const mensaje =
      productosAgregados === 1
        ? `Agregaste ${acortarNombre(nombre)} a tu lista`
        : `Agregaste ${productosAgregados} productos a tu lista`;

    mostrar('exito', mensaje, {
      id: ID_PRODUCTOS_AGREGADOS,
      accion: irALista && { etiqueta: 'Ver lista', onClick: irALista },
      duracion: DURACION.media,
      alCerrar: () => {
        productosAgregados = 0;
      },
    });
  },
};
