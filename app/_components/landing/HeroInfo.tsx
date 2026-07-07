'use client';
import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { MagnifyingGlassIcon } from '@phosphor-icons/react/dist/ssr';

export default function HeroInfo() {
  const [query, setQuery] = useState("");
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim().length >= 3) {
      inputRef.current?.blur();
      router.push(`/buscar?q=${encodeURIComponent(query)}`);
    }
  };

  return (
    <section 
      className="flex flex-col items-center justify-center text-center px-2 gap-6"
    >
      {/* Badge */}
      <span className="text-[11px] font-bold font-sans uppercase tracking-widest text-primary-400 bg-purple-50 mt-8 px-3 py-1 rounded-full border border-purple-100">
        De las bases oficiales del SEPA a tu celular.
      </span>

      {/* Headline */}
      <div className="flex flex-col gap-3">
        <h1 className="text-4xl font-black tracking-tight font-display text-slate-900 leading-tight">
          Buscá productos<br />
          <span className="text-primary-500">Compará precios</span><br />
          Ahorrá.
        </h1>
        <p className="text-sm text-slate-500 font-sans leading-relaxed max-w-xs mx-auto">
          Los precios de todos los supermercados argentinos en un solo lugar.
        </p>
      </div>

      {/* Buscador protagonista */}
      <form onSubmit={handleSearch} className="w-full max-w-sm">
        <div className="relative">
          <span className="absolute inset-y-0 left-4 flex items-center text-slate-400 pointer-events-none z-10">
            <MagnifyingGlassIcon size={20} weight="bold" />
          </span>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ej: Leche, Arroz, Aceite..."
            className="w-full pl-11 pr-4 py-4 bg-white border-2 border-accent-300 focus:border-primary-400 rounded-2xl text-sm font-sans focus:outline-none shadow-md text-slate-800 placeholder-slate-400 transition"
          />
        </div>
        <button
          type="submit"
          disabled={!!(query.trim().length < 3)}
          className="mt-3 w-full py-3.5 bg-primary-500 hover:bg-orange-600 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold font-sans rounded-2xl shadow-md active:scale-[0.98] transition-all text-sm"
        >
          Buscar productos
        </button>
      </form>

      {/* Scroll hint */}
      <div className="flex flex-col items-center gap-1 text-slate-300 animate-bounce mt-2">
        <span className="text-[10px] font-sans uppercase tracking-widest">¿Cómo funciona?</span>
        <span className="text-lg">↓</span>
      </div>
    </section>
  );
}