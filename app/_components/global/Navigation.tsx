'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MagnifyingGlassIcon, ScalesIcon, ShoppingCartIcon } from '@phosphor-icons/react/dist/ssr';
import { useListaStore } from '@/app/_store/store';

const CLAVE_VISTO = 'lalista-comparar-visto';

export default function Navigation() {
  const totalEnLista = useListaStore((state) => state.lista.length);
  const pathname = usePathname();

  const [flashColor, setFlashColor] = useState<'up' | 'down' | null>(null);
  const prevTotalRef = useRef(totalEnLista);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [ultimoVisto, setUltimoVisto] = useState<number | null>(null);
  const [pulso, setPulso] = useState(false);
  const puntoVisibleRef = useRef(false);
  const totalPulsoRef = useRef(totalEnLista);
  const pulsoTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const guardado = window.localStorage.getItem(CLAVE_VISTO);
    setUltimoVisto(guardado !== null ? Number(guardado) : 0);
  }, []);

  useEffect(() => {
    const prev = prevTotalRef.current;

    if (prev !== totalEnLista) {
      setFlashColor(totalEnLista > prev ? 'up' : 'down');

      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        setFlashColor(null);
      }, 1000);

      prevTotalRef.current = totalEnLista;
    }
  }, [totalEnLista]);

  useEffect(() => {
    if (pathname === '/comparativa') {
      setUltimoVisto(totalEnLista);
      window.localStorage.setItem(CLAVE_VISTO, String(totalEnLista));
    }
  }, [pathname, totalEnLista]);

  const isActive = (path: string) => pathname === path;

  const mostrarPunto =
    ultimoVisto !== null &&
    totalEnLista > 0 &&
    totalEnLista !== ultimoVisto &&
    !isActive('/comparativa');

  // pulso cuando se suma un producto
  useEffect(() => {
    const subio = totalEnLista > totalPulsoRef.current;
    const recienAparece = mostrarPunto && !puntoVisibleRef.current;

    totalPulsoRef.current = totalEnLista;
    puntoVisibleRef.current = mostrarPunto;

    if (!mostrarPunto) {
      setPulso(false);
      return;
    }

    if (subio || recienAparece) {
      setPulso(true);
      if (pulsoTimeoutRef.current) clearTimeout(pulsoTimeoutRef.current);
      pulsoTimeoutRef.current = setTimeout(() => setPulso(false), 500);
    }
  }, [mostrarPunto, totalEnLista]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (pulsoTimeoutRef.current) clearTimeout(pulsoTimeoutRef.current);
    };
  }, []);

  const badgeColorClass =
    flashColor === 'up'
      ? 'bg-green-500'
      : flashColor === 'down'
      ? 'bg-red-500'
      : 'bg-primary-400';

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-accent-300 py-2 px-6 z-50 md:hidden shadow-[0_-4px_12px_rgba(0,0,0,0.03)]">
      <div className="flex items-center justify-around max-w-md mx-auto">
        {/* BUSCAR */}
        <Link
          href="/buscar"
          className={`flex flex-col items-center gap-0.5 transition ${isActive('/buscar') ? 'text-primary-400' : 'text-slate-400 hover:text-primary-500'}`}
        >
          <MagnifyingGlassIcon className="w-6 h-6" strokeWidth={1.5} />
          <span className="text-[10px] font-semibold font-sans">Buscar</span>
        </Link>

        {/* MI LISTA */}
        <Link
          href="/mi-lista"
          className={`flex flex-col items-center gap-0.5 transition relative ${isActive('/mi-lista') ? 'text-primary-400' : 'text-slate-400 hover:text-primary-500'}`}
        >
          <ShoppingCartIcon className="w-6 h-6" weight={isActive('/mi-lista') ? 'fill' : 'light'} />
          <span className="text-[10px] font-semibold font-sans">Mi Lista</span>
          {totalEnLista > 0 && (
            <span
              className={`absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold text-white transition-colors duration-500 ${badgeColorClass}`}
            >
              {totalEnLista}
            </span>
          )}
        </Link>

        {/* COMPARAR */}
        <Link
          href="/comparativa"
          className={`flex flex-col items-center gap-0.5 transition relative ${isActive('/comparativa') ? 'text-primary-400' : 'text-slate-400 hover:text-primary-500'}`}
        >
          <ScalesIcon className="w-6 h-6" weight={isActive('/comparativa') ? 'fill' : 'light'} />
          <span className="text-[10px] font-semibold font-sans">Comparar</span>
          {mostrarPunto && (
            <span
              aria-hidden="true"
              className={`absolute -top-0.5 right-0 h-2 w-2 rounded-full bg-primary-400 ring-2 ring-white transition-transform duration-300 ${pulso ? 'scale-150' : 'scale-100'}`}
            />
          )}
        </Link>
      </div>
    </nav>
  );
}