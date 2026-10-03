// app/(main)/mi-lista/_hooks/useQuitarConDeshacer.ts
'use client';

import { useListaStore } from '@/app/_store/store';
import { avisar, acortarNombre } from '@/app/_lib/avisos';
import { formatearNombre } from '@/app/_lib/utils/formatters';
import { obtenerNombreComunGrupo } from '@/app/_lib/utils/obtenerNombreComunGrupo';

/**
 * Quitar productos de "Mi lista" con opción de deshacer.
 *
 * En vez de preguntar "¿Estás seguro?" antes de borrar, se borra directo y
 * aparece un aviso con "Deshacer" durante unos segundos. Es más rápido y, si
 * fue sin querer, se recupera con un toque.
 */
export function useQuitarConDeshacer() {
  const eliminarGrupo = useListaStore((state) => state.eliminarGrupo);
  const eliminarOpcion = useListaStore((state) => state.eliminarOpcion);
  const restaurarGrupo = useListaStore((state) => state.restaurarGrupo);

  // Se lee del store en el momento (no del render) para guardar el estado
  // exacto que había antes de borrar.
  const buscarGrupo = (grupoId: string) => {
    const lista = useListaStore.getState().lista;
    const indice = lista.findIndex((g) => g.grupoId === grupoId);
    return { grupo: indice >= 0 ? lista[indice] : null, indice };
  };

  const quitarGrupo = (grupoId: string) => {
    const { grupo, indice } = buscarGrupo(grupoId);
    if (!grupo) return;

    eliminarGrupo(grupoId);

    const nombre = grupo.nombrePersonalizado || obtenerNombreComunGrupo(grupo.opciones);
    avisar.deshacer(`Quitaste ${acortarNombre(nombre)} de tu lista`, () =>
      restaurarGrupo(grupo, indice)
    );
  };

  const quitarOpcion = (grupoId: string, productoId: string) => {
    const { grupo, indice } = buscarGrupo(grupoId);
    const opcion = grupo?.opciones.find((o) => o.id === productoId);
    if (!grupo || !opcion) return;

    eliminarOpcion(grupoId, productoId);

    avisar.deshacer(`Quitaste ${acortarNombre(formatearNombre(opcion.nombre))} de tu lista`, () =>
      restaurarGrupo(grupo, indice)
    );
  };

  return { quitarGrupo, quitarOpcion };
}
