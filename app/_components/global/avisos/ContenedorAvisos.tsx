'use client';

import { Toaster } from 'sonner';
import { useSearchParams } from 'next/navigation';

/**
 * Lugar donde aparecen los avisos flotantes (toasts) de toda la app.
 *
 * Se monta una sola vez, en el layout raiz, asi funciona tambien en las vistas
 * de (fullscreen) y los avisos sobreviven a una navegacion (por ejemplo, el
 * "Cerraste sesion" que aparece despues de volver al inicio).
 *
 * Para mostrar un aviso se usa `avisar` (app/_lib/avisos.tsx), nunca `toast`
 * de sonner directo.
 *
 * Posicion: abajo y al centro. La altura sale de --avisos-abajo (globals.css):
 * en mobile queda arriba de la navegacion inferior. Si AvisoComparar esta a la
 * vista (?comparar= con un solo producto), los avisos se apilan arriba de el
 * para no taparlo.
 */
export function ContenedorAvisos() {
  const searchParams = useSearchParams();
  const comparando = (searchParams.get('comparar') || '').split(',').filter(Boolean);
  const hayAvisoComparar = comparando.length === 1;

  const abajo = hayAvisoComparar
    ? 'calc(var(--avisos-abajo) + 5rem)'
    : 'var(--avisos-abajo)';

  return (
    <Toaster
      position="bottom-center"
      visibleToasts={3}
      gap={8}
      offset={{ bottom: abajo }}
      mobileOffset={{ bottom: abajo, left: 16, right: 16 }}
      containerAriaLabel="Avisos"
      // Los avisos son custom (sin estilos de sonner): sin esto cada uno toma
      // el ancho de su texto y quedan de distintos tamaños.
      toastOptions={{ className: 'w-full' }}
    />
  );
}
