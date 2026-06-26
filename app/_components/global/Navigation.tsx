"use client";
import Link from 'next/link';
import { MagnifyingGlassIcon, ScalesIcon, ShoppingCartIcon } from '@phosphor-icons/react/dist/ssr';
import { useListaStore } from '@/app/_store/store';

export default function Navigation() {
  const totalEnLista = useListaStore((state) => state.lista.length);

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-accent-300 py-2 px-6 z-50 md:hidden shadow-[0_-4px_12px_rgba(0,0,0,0.03)]">
      <div className="flex items-center justify-around max-w-md mx-auto">
        
        {/* BUSCAR */}
        <Link href="/buscar" className="flex flex-col items-center gap-0.5 text-slate-400 hover:text-primary-500 transition">
          <MagnifyingGlassIcon
            className="w-6 h-6 transition-all duration-200 hover:scale-110" 
            strokeWidth={1.5} 
            stroke="currentColor" 
          />
          <span className="text-[10px] font-semibold font-sans">Buscar</span>
        </Link>

        {/* MI LISTA */}
        <Link href="/mi-lista" className="flex flex-col items-center gap-0.5 text-slate-400 hover:text-primary-500 transition relative">
            <ShoppingCartIcon 
              className="w-6 h-6 transition-all duration-200 hover:scale-110" 
              weight="light"
              stroke="currentColor" 
            />
          <span className="text-[10px] font-semibold font-sans">Mi Lista</span>
          {/* Badge indicador usando el acento púrpura (primary-400) */}
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary-400 text-[9px] font-bold text-white animate-bounce">
            {totalEnLista}
          </span>
        </Link>

        {/* COMPARAR */}
        <Link href="/comparativa" className="flex flex-col items-center gap-0.5 text-slate-400 hover:text-primary-500 transition">
          <ScalesIcon 
            className="w-6 h-6 transition-all duration-200 hover:scale-110" 
            strokeWidth={1.5} 
            stroke="currentColor" 
          />
          <span className="text-[10px] font-semibold font-sans">Comparar</span>
        </Link>

      </div>
    </nav>
  );
}