'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { client } from '@/app/_lib/hono-client';
import { useListaStore } from '@/app/_store/store';
import type { DetalleProducto, Producto } from '@/app/_types/productos';

export interface ProductoComparado {
  detalle: DetalleProducto;
  /** Precios por comercio. Vacio si el usuario no tiene ubicacion puesta. */
  sucursales: Producto['sucursales'];
}

/**
 * Maneja la comparacion de dos productos.
 *
 * El estado vive en la URL, igual que la ficha:
 *
 *   ?comparar=EAN_A          -> A elegido, esperando el segundo
 *   ?comparar=EAN_A,EAN_B    -> se muestra la comparacion
 *
 * Eso hace que el boton "atras" deshaga cada paso y que la comparacion se
 * pueda compartir por link.
 */
export const useComparar = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { sucursalesIds } = useListaStore();

  const param = searchParams.get('comparar') || '';
  const ids = param ? param.split(',').filter(Boolean).slice(0, 2) : [];

  const [productos, setProductos] = useState<ProductoComparado[]>([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(false);

  const actualizar = useCallback(
    (nuevos: string[]) => {
      const params = new URLSearchParams(searchParams.toString());
      if (nuevos.length > 0) params.set('comparar', nuevos.join(','));
      else params.delete('comparar');
      // Al comparar se cierra la ficha: son dos vistas distintas.
      params.delete('producto');
      const query = params.toString();
      router.replace(query ? `?${query}` : window.location.pathname, { scroll: false });
    },
    [router, searchParams]
  );

  /** Agrega un producto. Si ya hay dos, reemplaza el segundo. */
  const agregar = useCallback(
    (id: string) => {
      if (ids.includes(id)) return;
      actualizar(ids.length >= 2 ? [ids[0], id] : [...ids, id]);
    },
    [ids, actualizar]
  );

  const quitar = useCallback(
    (id: string) => actualizar(ids.filter((x) => x !== id)),
    [ids, actualizar]
  );

  const limpiar = useCallback(() => actualizar([]), [actualizar]);

  // Se traen los datos solo cuando hay dos: con uno solo todavia no hay nada
  // que mostrar, apenas la marca de "elegido".
  useEffect(() => {
    if (ids.length < 2) {
      setProductos([]);
      setError(false);
      return;
    }

    let cancelado = false;
    setCargando(true);
    setError(false);

    (async () => {
      try {
        // Las fichas van en paralelo; los precios en una sola consulta porque
        // el endpoint acepta varios ids a la vez.
        const [fichas, precios] = await Promise.all([
          Promise.all(
            ids.map(async (id) => {
              const res = await client.api.producto[':id'].$get({ param: { id } });
              if (!res.ok) throw new Error(`Status: ${res.status}`);
              const data = (await res.json()) as { producto?: DetalleProducto };
              return data.producto ?? null;
            })
          ),
          (async () => {
            if (!sucursalesIds || sucursalesIds.length === 0) return [];
            const res = await client.api['precios-por-ids-area'].$get({
              query: {
                ids: ids.join(','),
                sucursales_ids: sucursalesIds.join(','),
              },
            });
            if (!res.ok) return [];
            const data = (await res.json()) as { productos?: Producto[] };
            return data.productos ?? [];
          })(),
        ]);

        if (cancelado) return;

        if (fichas.some((f) => !f)) {
          setError(true);
          return;
        }

        setProductos(
          fichas.map((detalle) => ({
            detalle: detalle!,
            sucursales: precios.find((p) => p.id === detalle!.id_producto)?.sucursales ?? [],
          }))
        );
      } catch (e) {
        console.error('No se pudo cargar la comparacion:', e);
        if (!cancelado) setError(true);
      } finally {
        if (!cancelado) setCargando(false);
      }
    })();

    return () => {
      cancelado = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [param, sucursalesIds]);

  return {
    ids,
    productos,
    cargando,
    error,
    agregar,
    quitar,
    limpiar,
    /** true cuando hay uno elegido y falta el segundo. */
    esperandoSegundo: ids.length === 1,
    /** true cuando hay dos y se muestra la comparacion. */
    comparando: ids.length === 2,
  };
};
