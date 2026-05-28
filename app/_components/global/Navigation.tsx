"use client";
import Link from 'next/link';

export default function Navigation() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-accent-300 py-2 px-6 z-50 md:hidden shadow-[0_-4px_12px_rgba(0,0,0,0.03)]">
      <div className="flex items-center justify-around max-w-md mx-auto">
        
        {/* BUSCAR */}
        <Link href="/buscar" className="flex flex-col items-center gap-0.5 text-slate-400 hover:text-primary-500 transition">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.602 10.602Z" />
          </svg>
          <span className="text-[10px] font-semibold font-sans">Buscar</span>
        </Link>

        {/* MI LISTA */}
        <Link href="/mi-lista" className="flex flex-col items-center gap-0.5 text-slate-400 hover:text-primary-500 transition relative">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
          </svg>
          <span className="text-[10px] font-semibold font-sans">Mi Lista</span>
          {/* Badge indicador usando el acento púrpura (primary-400) */}
          <span className="absolute -top-1 -right-1 bg-primary-400 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center animate-bounce">0</span>
        </Link>

        {/* COMPARAR */}
        <Link href="/comparativa" className="flex flex-col items-center gap-0.5 text-slate-400 hover:text-primary-500 transition">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
          </svg>
          <span className="text-[10px] font-semibold font-sans">Comparar</span>
        </Link>

      </div>
    </nav>
  );
}