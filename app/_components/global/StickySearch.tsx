'use client'; // Necesitamos esto porque usamos hooks
import { useListaStore } from '@/app/_store/store';
import { useRouter } from 'next/navigation';
import { useState, useRef } from 'react';
import { ShoppingCartIcon } from '@phosphor-icons/react/dist/ssr';
import { DesktopActionButton } from './DesktopActionButton';

export default function StickySearch() {
  const [query, setQuery] = useState("");
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const setTerminoBusqueda = useListaStore((state) => state.setTerminoBusqueda);
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const terminoLimpio = query.trim();
    if (query.trim().length >= 3) {
      inputRef.current?.blur();
      setTerminoBusqueda(terminoLimpio);
      router.push(`/buscar?q=${encodeURIComponent(query)}`);
    }
  };

return (
    <div className="sticky top-[57px] z-40 w-full backdrop-blur-md px-2 py-2">
      <div className="mx-auto flex max-w-5xl flex-col gap-2 md:flex-row md:items-center md:justify-center md:gap-3">
        <form
          onSubmit={handleSearch}
          className="relative w-full md:w-[560px] md:shrink-0 md:flex-none"
        >
          <span className="absolute inset-y-0 left-3 flex items-center text-slate-400">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="h-5 w-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.602 10.602Z"
              />
            </svg>
          </span>

          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="¿Qué producto buscas hoy? (Ej: Leche, Arroz)"
            className="w-full rounded-xl border border-accent-300 bg-white py-2.5 pl-10 pr-4 text-sm font-sans text-slate-800 shadow-sm transition placeholder-slate-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
        </form>

        <div className="w-full md:w-auto md:shrink-0">
          <DesktopActionButton
            href="/mi-lista"
            label="Ver mi lista"
            icon={<ShoppingCartIcon weight="bold" />}
            color="lila"
            variant="solid"
            className="w-full md:w-auto"
          />
        </div>
      </div>
    </div>
  );
}