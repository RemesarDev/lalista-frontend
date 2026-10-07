'use client';

import { useEffect, useState } from 'react';

// Tiempo de espera desde el ultimo toque hasta aplicar los filtros. Da margen
// para elegir varios chips seguidos (o arrepentirse) con una sola busqueda.
export const DEMORA_FILTROS_MS = 800;

interface Opciones {
  /** Etiquetas aplicadas hoy, tal como vienen en la URL. */
  aplicadas: string[];
  /** Escribe las etiquetas en la URL, que es lo que dispara la busqueda. */
  aplicar: (etiquetas: string[]) => void;
  demoraMs?: number;
}

/**
 * Separa la seleccion visible de los chips de la seleccion aplicada.
 *
 * Antes cada toque en un chip reescribia la URL y eso disparaba una peticion
 * al momento: elegir tres filtros eran tres busquedas, de las que solo servia
 * la ultima. Ahora el chip cambia de color al instante, pero la URL (y con
 * ella la busqueda) se actualiza recien cuando el usuario deja de tocar
 * durante `demoraMs`. Si vuelve a la seleccion que ya estaba aplicada, no se
 * busca nada.
 */
export const useEtiquetasDiferidas = ({
  aplicadas,
  aplicar,
  demoraMs = DEMORA_FILTROS_MS,
}: Opciones) => {
  const clave = aplicadas.join(',');

  // Seleccion elegida que todavia no llego a la URL. null = no hay cambios.
  const [pendientes, setPendientes] = useState<string[] | null>(null);

  // Si la URL cambia (porque se aplico la seleccion, por el boton "atras" o
  // por una busqueda nueva), lo pendiente queda viejo y se descarta. Se hace
  // durante el render y no en un efecto para que no haya un cuadro en el que
  // el chip vuelva a su estado anterior.
  const [claveVista, setClaveVista] = useState(clave);
  if (clave !== claveVista) {
    setClaveVista(clave);
    setPendientes(null);
  }

  useEffect(() => {
    if (pendientes === null) return;
    const temporizador = setTimeout(() => aplicar(pendientes), demoraMs);
    return () => clearTimeout(temporizador);
  }, [pendientes, aplicar, demoraMs]);

  const seleccionadas = pendientes ?? aplicadas;

  const alternar = (codigo: string) => {
    const siguientes = seleccionadas.includes(codigo)
      ? seleccionadas.filter((e) => e !== codigo)
      : [...seleccionadas, codigo];

    // Volvio a lo que ya esta aplicado: se cancela la espera sin buscar.
    const igualQueAplicadas =
      siguientes.length === aplicadas.length &&
      siguientes.every((e) => aplicadas.includes(e));

    setPendientes(igualQueAplicadas ? null : siguientes);
  };

  return {
    /** Lo que muestran los chips. */
    seleccionadas,
    /** Hay una seleccion esperando para aplicarse. */
    aplicando: pendientes !== null,
    /** Seleccion pendiente, para no perderla si otra accion reescribe la URL. */
    pendientes,
    alternar,
  };
};
