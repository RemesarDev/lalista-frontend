'use client';

import { useCallback, useEffect, useState } from 'react';

// Bancos, tarjetas y billeteras que eligió el usuario en "¿Con qué pagás?".
// Se guarda en el navegador y lo comparten /promociones y /comparativa.
const CLAVE = 'lalista-mis-medios-pago';

const leer = (): string[] => {
  try {
    const guardado = window.localStorage.getItem(CLAVE);
    return guardado ? JSON.parse(guardado) : [];
  } catch {
    return [];
  }
};

const guardar = (lista: string[]) => {
  try {
    window.localStorage.setItem(CLAVE, JSON.stringify(lista));
  } catch {
    // Si el navegador no deja guardar, la elección vale solo para esta visita
  }
};

export function useMisMediosPago() {
  const [misMedios, setMisMedios] = useState<string[]>([]);

  // Leer lo que eligió en visitas anteriores (o en la otra sección)
  useEffect(() => {
    setMisMedios(leer());
  }, []);

  const cambiarMisMedios = useCallback((lista: string[]) => {
    setMisMedios(lista);
    guardar(lista);
  }, []);

  return { misMedios, cambiarMisMedios };
}