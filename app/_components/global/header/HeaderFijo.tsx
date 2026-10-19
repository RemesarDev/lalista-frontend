'use client';

import { useEffect, useRef, type ReactNode } from 'react';

/**
 * El <header> pegado arriba de la pantalla.
 *
 * Publica su alto real en la variable CSS --alto-header para que lo que se
 * pega debajo (por ejemplo el buscador de /buscar) sepa a que altura quedarse.
 * El alto no es fijo: en mobile el header suma la fila de direccion y radio, y
 * el nombre de la direccion o el logo pueden cambiarlo. Antes el buscador
 * usaba un valor escrito a mano (57px, el alto de escritorio) y en el celular
 * quedaba tapado por el header al scrollear.
 *
 * Mientras no corre JavaScript vale el valor de respaldo de globals.css.
 */
export default function HeaderFijo({
  className = '',
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const header = ref.current;
    if (!header) return;

    const raiz = document.documentElement;
    const publicarAlto = () => {
      raiz.style.setProperty('--alto-header', `${header.offsetHeight}px`);
    };

    publicarAlto();
    const observador = new ResizeObserver(publicarAlto);
    observador.observe(header);

    return () => {
      observador.disconnect();
      raiz.style.removeProperty('--alto-header');
    };
  }, []);

  return (
    <header ref={ref} className={className}>
      {children}
    </header>
  );
}
