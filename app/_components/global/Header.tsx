"use client";
import Link from 'next/link';

interface HeaderProps {
  locationName?: string;
}

export default function Header({ locationName }: HeaderProps) {
  return (
    <header className="w-full bg-white border-b border-accent-300 px-4 py-3 sticky top-0 z-50">
      <div className="flex items-center justify-between max-w-screen-xl mx-auto">
        
        {/* LOGO: Con la tipografía Montserrat (font-display) */}
        <Link href="/" className="flex items-center gap-1">
          <span className="text-2xl font-black tracking-tight font-display text-primary-400">
            LALI<span className="text-slate-800">sta</span>
          </span>
        </Link>

        {/* UBICACIÓN: Selector central con fondo secondary-50 */}
        <button 
          onClick={() => console.log('Abrir mapa')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary-50 hover:bg-orange-100 transition text-xs font-semibold font-sans text-slate-700 max-w-[180px] truncate border border-orange-100"
        >
          <span className="text-primary-500 text-sm">📍</span>
          <span className="truncate">
            {locationName || "Ubicación pendiente"}
          </span>
        </button>

        {/* LOGIN: Icono con hover sutil */}
        <button 
          onClick={() => console.log('Ir a login')}
          className="p-2 rounded-full hover:bg-secondary-50 text-slate-600 transition"
          aria-label="Iniciar sesión"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
          </svg>
        </button>

      </div>
    </header>
  );
}