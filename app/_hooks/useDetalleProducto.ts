'use client';

import { useEffect, useState } from 'react';
import { client } from '@/app/_lib/hono-client';
import type { DetalleProducto } from '@/app/_types/productos';

// Cache a nivel de modulo: si el usuario abre y cierra la misma ficha varias
// veces, no se vuelve a pedir. Los datos de un producto no cambian dentro de
// una sesion.
const cache = new Map<string, DetalleProducto>();

/**
 * Trae la ficha de un producto por su EAN.
 *
 * Recibe null cuando no hay ficha abierta, y en ese caso no pide nada.
 */
export const useDetalleProducto = (idProducto: string | null) => {
  const [producto, setProducto] = useState<DetalleProducto | null>(
    idProducto ? cache.get(idProducto) ?? null : null
  );
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!idProducto) {
      setProducto(null);
      setError(false);
      return;
    }

    const enCache = cache.get(idProducto);
    if (enCache) {
      setProducto(enCache);
      setCargando(false);
      setError(false);
      return;
    }

    let cancelado = false;
    setCargando(true);
    setError(false);

    (async () => {
      try {
        const res = await client.api.producto[':id'].$get({ param: { id: idProducto } });
        if (!res.ok) throw new Error(`Status: ${res.status}`);

        const data = (await res.json()) as { producto?: DetalleProducto };
        if (cancelado) return;

        if (data.producto) {
          cache.set(idProducto, data.producto);
          setProducto(data.producto);
        } else {
          setError(true);
        }
      } catch (e) {
        console.error('No se pudo cargar el detalle del producto:', e);
        if (!cancelado) setError(true);
      } finally {
        if (!cancelado) setCargando(false);
      }
    })();

    return () => {
      cancelado = true;
    };
  }, [idProducto]);

  return { producto, cargando, error };
};
