'use client';

import { MagnifyingGlassIcon, XIcon, MapPinIcon } from '@phosphor-icons/react/dist/ssr';

interface BuscadorUbicacionProps {
  direccion: string;
  setDireccion: (value: string) => void;
  isFocused: boolean;
  setIsFocused: (value: boolean) => void;
  sugerencias: any[];
  setSugerencias: (value: any[]) => void;
  onKeyDownInput: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onSeleccionDireccion: (sug: any) => void;
}

export default function BuscadorUbicacion({
  direccion,
  setDireccion,
  isFocused,
  setIsFocused,
  sugerencias,
  setSugerencias,
  onKeyDownInput,
  onSeleccionDireccion,
}: BuscadorUbicacionProps) {
  return (
    <div className="absolute top-4 inset-x-4 pl-14 z-20 max-w-md mx-auto">
      <div className="relative w-full shadow-lg rounded-xl overflow-hidden bg-white border border-slate-200/80">
        <MagnifyingGlassIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-base" />
        <input 
          type="text" 
          value={direccion}
          onChange={(e) => setDireccion(e.target.value)}
          onFocus={() => setIsFocused(true)}
          // El timeout evita que el blur cierre la lista antes de capturar el click en la sugerencia
          onBlur={() => setTimeout(() => setIsFocused(false), 300)}
          onKeyDown={onKeyDownInput} 
          placeholder="Ingresá tu dirección o barrio..." 
          className="w-full pl-10 pr-10 py-3.5 bg-white text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none"
        />
        {direccion && (
          <button 
            onClick={() => { setDireccion(''); setSugerencias([]); }} 
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
          >
            <XIcon weight="bold" className="text-xs" />
          </button>
        )}
      </div>

      {/* SUGERENCIAS EN TIEMPO REAL CLÁSICAS */}
      {isFocused && sugerencias.length > 0 && (
        <div className="mt-2 bg-white border border-slate-200/80 rounded-xl shadow-xl max-h-60 overflow-y-auto p-1 animate-fade-in">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 py-2 border-b border-slate-50">
            Sugerencias de Google Maps
          </p>
          {sugerencias.map((sug) => (
            <button
              key={sug.place_id || sug.description}
              type="button"
              onMouseDown={() => onSeleccionDireccion(sug)}
              className="w-full text-left px-3 py-2.5 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors flex items-center gap-2"
            >
              <MapPinIcon className="text-slate-400 text-sm flex-shrink-0" />
              <div className="flex flex-col truncate">
                <span className="font-semibold text-slate-800 truncate">
                  {sug.structured_formatting?.main_text || sug.description}
                </span>
                {sug.structured_formatting?.secondary_text && (
                  <span className="text-[10px] text-slate-400 truncate">
                    {sug.structured_formatting.secondary_text}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}