"use client";

import Link from 'next/link';
import { XIcon, MapPinIcon, UserIcon } from '@phosphor-icons/react/dist/ssr';

interface HeaderProps {
  locationName?: string;
  onLimpiarUbicacion?: () => void;
}

export default function Header({ locationName, onLimpiarUbicacion }: HeaderProps) {
  return (
    <header className="w-full bg-primary-400 border-b border-accent-300 px-4 py-3 sticky top-0 z-50 shadow-sm">
      <div className="flex items-center justify-between max-w-screen-xl mx-auto">
        
        <Link href="/" className="flex items-center gap-1">
          <span className="text-2xl font-black tracking-tight font-display text-white">
            LALI<span className="text-slate-800">sta</span>
          </span>
        </Link>

        <Link 
          href="/ubicacion"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 transition text-xs font-semibold font-sans text-white max-w-[180px] truncate"
        >
          <MapPinIcon className="text-white text-lg" weight="regular" />
          <span className="truncate">
            {locationName || "Ubicación pendiente"}
          </span>
        </Link>

        {onLimpiarUbicacion && (
          <button
            onClick={onLimpiarUbicacion}
            className="p-1 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 transition text-white ml-1"
            aria-label="Limpiar ubicación"
          >
            <XIcon weight="bold" className="text-xs" />
          </button>
        )}

        <button 
          onClick={() => console.log('Ir a login')}
          className="p-0.5 rounded-full transition-colors"
          aria-label="Iniciar sesión"
        >
          <span className="w-9 h-9 rounded-full border border-white/20 bg-white/10 flex items-center justify-center flex-shrink-0 hover:bg-white/20 transition-colors">
            <UserIcon className="text-white text-lg" weight="regular" />
          </span>
        </button>

      </div>
    </header>
  );
}