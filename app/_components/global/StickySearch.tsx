'use client'; // Necesitamos esto porque usamos hooks
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function StickySearch() {
  const [query, setQuery] = useState("");
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim().length >= 3) {
      // Redirigimos al usuario a /buscar con el parámetro 'q'
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
          type="text" 
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="¿Qué producto buscas hoy? (Ej: Leche, Arroz)" 
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-accent-300 rounded-xl text-sm font-sans focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 shadow-sm text-slate-800 placeholder-slate-400 transition"
        />
      </form>
    </div>
  );
}