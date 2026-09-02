'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { GrupoLista } from '@/app/_store/store';
import { obtenerTopTresCadenasMasBaratas } from '@/app/(main)/comparativa/_lib/Funciones-comparacion';
import type { Changuito, ProductoChanguito } from '../_types/changuito';

const STORAGE_KEY = 'lalista-changuitos';

function hoyISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function mesActual(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function formatearFechaCorta(fechaISO: string): string {
  const [, mes, dia] = fechaISO.split('-');
  return `${dia}/${mes}`;
}

/**
 * Maneja la lista de "changuitos" que el usuario decide seguir en el tiempo.
 * Se guardan en localStorage (no depende de login) — se puede tener más de
 * uno en simultáneo, ninguno se pisa con el siguiente.
 */
export function useChanguitos() {
  const [changuitos, setChanguitos] = useState<Changuito[]>([]);
  const [seleccionadoId, setSeleccionadoId] = useState<string | null>(null);
  const [cargado, setCargado] = useState(false);

  useEffect(() => {
    try {
      const guardado = window.localStorage.getItem(STORAGE_KEY);
      if (guardado) {
        const lista: Changuito[] = JSON.parse(guardado);
        setChanguitos(lista);
        if (lista.length) setSeleccionadoId(lista[lista.length - 1].id);
      }
    } catch {
      
    }
    setCargado(true);
  }, []);

  const persistir = useCallback((nuevos: Changuito[]) => {
    setChanguitos(nuevos);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nuevos));
    } catch {
      
    }
  }, []);

  const iniciarSeguimiento = useCallback(
    (lista: GrupoLista[]) => {
      const top3 = obtenerTopTresCadenasMasBaratas(lista);
      const fecha = hoyISO();
      const mes = mesActual();

      // Cada item de `lista` es un GRUPO (puede tener una opción principal +
      // alternativas). Para el changuito nos quedamos con la opción
      // principal de cada grupo (`opciones[0]`) — es la misma que usa el
      // resto de la app como "el producto elegido". Si algún grupo quedó
      // sin ninguna opción cargada (no debería pasar, pero por las dudas),
      // lo salteamos en vez de romper el changuito entero.
      const productos: ProductoChanguito[] = lista
        .map((grupo) => {
          const principal = grupo.opciones[0];
          if (!principal) return null;
          return { id: principal.id, nombre: principal.nombre, urlImagen: principal.url_imagen, cantidad: grupo.cantidad };
        })
        .filter((p): p is ProductoChanguito => p !== null);

      const nuevo: Changuito = {
        id: `${Date.now()}`,
        nombre: `Changuito del ${formatearFechaCorta(fecha)}`,
        fechaInicio: fecha,
        productos,
        supermercados: top3.map((s) => ({
          clave: `${s.id_comercio}-${s.id_bandera}`,
          idComercio: s.id_comercio,
          idBandera: s.id_bandera,
          cadena: s.cadena,
          direccion: s.direccion,
        })),
        historialPorSupermercado: top3.map((s) => ({
          clave: `${s.id_comercio}-${s.id_bandera}`,
          puntos: [{ mes, precioTotal: s.total }],
        })),
      };

      const nuevos = [...changuitos, nuevo];
      persistir(nuevos);
      setSeleccionadoId(nuevo.id);
    },
    [changuitos, persistir],
  );

  /** Agrega (o actualiza, si ya hay uno de este mes) un punto para un supermercado puntual. */
  const registrarPunto = useCallback((changuitoId: string, claveSupermercado: string, precioTotal: number) => {
    setChanguitos((actuales) => {
      const mes = mesActual();
      const nuevos = actuales.map((ch) => {
        if (ch.id !== changuitoId) return ch;
        const historialPorSupermercado = ch.historialPorSupermercado.map((h) => {
          if (h.clave !== claveSupermercado) return h;
          const puntos = [...h.puntos];
          const ultimo = puntos.at(-1);
          if (ultimo && ultimo.mes === mes) {
            puntos[puntos.length - 1] = { mes, precioTotal };
          } else {
            puntos.push({ mes, precioTotal });
          }
          return { ...h, puntos };
        });
        return { ...ch, historialPorSupermercado };
      });

      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nuevos));
      } catch {
        
      }
      return nuevos;
    });
  }, []);

  /** Borra un changuito (y su historial) de forma definitiva. Si era el
   * seleccionado, pasa a seleccionar el que quedó más reciente (o ninguno). */
  const eliminarChanguito = useCallback(
    (id: string) => {
      const nuevos = changuitos.filter((ch) => ch.id !== id);
      persistir(nuevos);
      setSeleccionadoId((actual) => {
        if (actual !== id) return actual;
        return nuevos.length ? nuevos[nuevos.length - 1].id : null;
      });
    },
    [changuitos, persistir],
  );

  const changuitoSeleccionado = useMemo(
    () => changuitos.find((c) => c.id === seleccionadoId) ?? null,
    [changuitos, seleccionadoId],
  );

  return {
    changuitos,
    changuitoSeleccionado,
    seleccionarChanguito: setSeleccionadoId,
    cargado,
    iniciarSeguimiento,
    registrarPunto,
    eliminarChanguito,
  };
}