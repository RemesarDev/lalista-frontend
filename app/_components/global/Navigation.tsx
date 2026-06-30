"use client";
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { MagnifyingGlassIcon, ScalesIcon, ShoppingCartIcon } from '@phosphor-icons/react/dist/ssr';
import { useListaStore } from '@/app/_store/store';

export default function Navigation() {
  const totalEnLista = useListaStore((state) => state.lista.length);
  
  // Estado local para manejar las clases de la animación
  const [animClass, setAnimClass] = useState("bg-primary-400");
  const prevTotal = useRef(totalEnLista);

  useEffect(() => {
    // Si el total no cambió, no hacemos nada
    if (totalEnLista === prevTotal.current) return;

    // Determinamos si es incremento o decremento
    const esIncremento = totalEnLista > prevTotal.current;
    
    // Aplicamos color y clase (verde para sumar, rojo para quitar)
    setAnimClass(esIncremento 
      ? "bg-emerald-500 scale-125" 
      : "bg-red-500 scale-90"
    );

    // Volvemos al estado original después de 1.5 segundos
    const timer = setTimeout(() => {
      setAnimClass("bg-primary-400 scale-100");
    }, 1500);

    prevTotal.current = totalEnLista;
    return () => clearTimeout(timer);
  }, [totalEnLista]);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-accent-300 bg-white px-6 py-2 shadow-[0_-4px_12px_rgba(0,0,0,0.03)] md:hidden">
      <div className="mx-auto flex max-w-md items-center justify-around">
        
        {/* BUSCAR */}
        <Link href="/buscar" className="flex flex-col items-center gap-0.5 text-slate-400 transition hover:text-primary-500">
          <MagnifyingGlassIcon
            className="h-6 w-6 transition-all duration-200 hover:scale-110" 
            strokeWidth={1.5} 
            stroke="currentColor" 
          />
          <span className="font-sans text-[10px] font-semibold">Buscar</span>
        </Link>

        {/* MI LISTA */}
        <Link href="/mi-lista" className="relative flex flex-col items-center gap-0.5 text-slate-400 transition hover:text-primary-500">
          <ShoppingCartIcon 
            className="h-6 w-6 transition-all duration-200 hover:scale-110" 
            weight="light"
            stroke="currentColor" 
          />
          <span className="font-sans text-[10px] font-semibold">Mi Lista</span>
          
          {/* Badge con clases dinámicas */}
          <span className={`absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold text-white transition-all duration-300 ${animClass}`}>
            {totalEnLista}
          </span>
        </Link>

        {/* COMPARAR */}
        <Link href="/comparativa" className="flex flex-col items-center gap-0.5 text-slate-400 transition hover:text-primary-500">
          <ScalesIcon 
            className="h-6 w-6 transition-all duration-200 hover:scale-110" 
            strokeWidth={1} 
            stroke="currentColor" 
          />
          <span className="font-sans text-[10px] font-semibold">Comparar</span>
        </Link>

      </div>
    </nav>
  );
}