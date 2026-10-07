'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

// Tiempo de espera desde el ultimo toque hasta aplicar los filtros. Da margen
// para elegir varias cosas seguidas (o arrepentirse) con una sola busqueda.
export const DEMORA_FILTROS_MS = 800;

export interface Filtros {
  categoria: string;
  etiquetas: string[];
}

interface ContextoFiltros {
  /** Lo que se ve marcado en pantalla: lo aplicado mas lo que esta esperando. */
  visibles: Filtros;
  /** Hay cambios esperando a que termine la demora. */
  aplicando: boolean;
  elegirCategoria: (slug: string) => void;
  quitarCategoria: () => void;
  alternarEtiqueta: (codigo: string) => void;
  /** Olvida lo pendiente sin aplicarlo (por ejemplo, antes de una busqueda nueva). */
  descartar: () => void;
}

const Contexto = createContext<ContextoFiltros | null>(null);

const leerEtiquetas = (valor: string | null) =>
  valor ? valor.split(',').filter(Boolean) : [];

const mismosFiltros = (a: Filtros, b: Filtros) =>
  a.categoria === b.categoria &&
  a.etiquetas.length === b.etiquetas.length &&
  a.etiquetas.every((e) => b.etiquetas.includes(e));

/**
 * Filtros de /buscar con espera antes de buscar.
 *
 * Antes cada toque en una categoria del menu o en un chip de etiqueta
 * reescribia la URL, y eso disparaba una peticion en el momento: elegir un
 * rubro, cambiar de idea y elegir otro, o marcar tres etiquetas, eran varias
 * busquedas de las que solo servia la ultima.
 *
 * Ahora lo elegido se marca al instante pero la URL (y con ella la busqueda)
 * se actualiza recien cuando el usuario deja de tocar durante
 * DEMORA_FILTROS_MS. Categoria y etiquetas comparten el mismo temporizador,
 * asi que cualquier combinacion elegida seguida es una sola peticion. Si se
 * vuelve a lo que ya estaba aplicado, no se busca nada.
 *
 * Lo comparten el menu de categorias (en StickySearch) y los chips (en
 * FiltrosBusqueda), que son hermanos en la pagina, por eso es un contexto.
 */
export function FiltrosDiferidosProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const categoria = searchParams.get('categoria') || '';
  const etiquetasParam = searchParams.get('etiquetas') || '';
  const clave = `${categoria}|${etiquetasParam}`;

  const [pendientes, setPendientes] = useState<Filtros | null>(null);

  // Si la URL cambia (porque se aplico lo pendiente, por el boton "atras" o
  // por una busqueda nueva), lo pendiente queda viejo y se descarta. Se hace
  // durante el render y no en un efecto para que no haya un cuadro en el que
  // lo marcado vuelva a su estado anterior.
  const [claveVista, setClaveVista] = useState(clave);
  if (clave !== claveVista) {
    setClaveVista(clave);
    setPendientes(null);
  }

  const aplicados: Filtros = { categoria, etiquetas: leerEtiquetas(etiquetasParam) };
  const visibles = pendientes ?? aplicados;

  const aplicar = useCallback(
    (filtros: Filtros) => {
      const params = new URLSearchParams(searchParams.toString());

      if (filtros.categoria) params.set('categoria', filtros.categoria);
      else params.delete('categoria');

      if (filtros.etiquetas.length > 0) params.set('etiquetas', filtros.etiquetas.join(','));
      else params.delete('etiquetas');

      const url = `/buscar?${params.toString()}`;

      // Cambiar de categoria deja una entrada en el historial, asi "atras"
      // vuelve a la anterior. Las etiquetas se reemplazan, como antes.
      if (filtros.categoria !== (searchParams.get('categoria') || '')) {
        router.push(url, { scroll: false });
      } else {
        router.replace(url, { scroll: false });
      }
    },
    [router, searchParams]
  );

  useEffect(() => {
    if (pendientes === null) return;
    const temporizador = setTimeout(() => aplicar(pendientes), DEMORA_FILTROS_MS);
    return () => clearTimeout(temporizador);
  }, [pendientes, aplicar]);

  // Cada cambio reinicia la espera. Si el resultado es igual a lo aplicado,
  // se cancela sin buscar.
  const cambiar = (siguientes: Filtros) => {
    setPendientes(mismosFiltros(siguientes, aplicados) ? null : siguientes);
  };

  const valor: ContextoFiltros = {
    visibles,
    aplicando: pendientes !== null,
    elegirCategoria: (slug) => cambiar({ ...visibles, categoria: slug }),
    quitarCategoria: () => cambiar({ ...visibles, categoria: '' }),
    alternarEtiqueta: (codigo) =>
      cambiar({
        ...visibles,
        etiquetas: visibles.etiquetas.includes(codigo)
          ? visibles.etiquetas.filter((e) => e !== codigo)
          : [...visibles.etiquetas, codigo],
      }),
    descartar: () => setPendientes(null),
  };

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export const useFiltrosDiferidos = () => {
  const contexto = useContext(Contexto);
  if (!contexto) {
    throw new Error('useFiltrosDiferidos tiene que usarse dentro de FiltrosDiferidosProvider');
  }
  return contexto;
};
