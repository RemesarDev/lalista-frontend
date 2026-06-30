'use client'; 
import { useListaStore } from '@/app/_store/store';
import { useRouter } from 'next/navigation';
import { useState, useRef } from 'react';

export default function StickySearch() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Seleccionamos las partes del store que necesitamos
  const setTerminoBusqueda = useListaStore((state) => state.setTerminoBusqueda);
  const terminoGuardado = useListaStore((state) => state.terminoBusqueda);
  
  const [query, setQuery] = useState(terminoGuardado || "");

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setTerminoBusqueda(value); // Sincroniza con el almacenamiento persistente
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim().length >= 3) {
      inputRef.current?.blur();
      router.push(`/buscar?q=${encodeURIComponent(query)}`);
    }
  };

  return (
    <div className="w-full bg-secondary-100/90 backdrop-blur-md py-3 px-4 sticky top-[57px] z-40 border-b border-accent-300">
      <form onSubmit={handleSearch} className="max-w-md mx-auto relative">
        <span className="absolute inset-y-0 left-3 flex items-center text-slate-400">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.602 10.602Z" />
          </svg>
        </span>
        <input 
          ref={inputRef}
          type="text" 
          value={query}
          onChange={handleInputChange} // Ahora solo hay uno
          placeholder="¿Qué producto buscas hoy? (Ej: Leche, Arroz)" 
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-accent-300 rounded-xl text-sm font-sans focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 shadow-sm text-slate-800 placeholder-slate-400 transition"
        />
      </form>
    </div>
  );
}