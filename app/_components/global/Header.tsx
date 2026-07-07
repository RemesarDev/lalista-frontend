'use client';

import Link from 'next/link';
import NextImage from 'next/image';
import { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { MapPinIcon, XIcon, SignOutIcon, UserIcon } from '@phosphor-icons/react/dist/ssr';
import { useListaStore } from '@/app/_store/store';

interface HeaderProps {
  locationName?: string;
  onLimpiarUbicacion?: () => void;
  children?: ReactNode;
}

export default function Header({ locationName, onLimpiarUbicacion, children }: HeaderProps) {
  const user = useListaStore((state) => state.user);
  const logout = useListaStore((state) => state.logout);
  const router = useRouter();

  const irAUbicacion = () => {
    router.push('/ubicacion');
  };

  return (
    <header className="w-full bg-primary-400 border-b border-accent-300 px-4 py-3 sticky top-0 z-50 shadow-sm">
      {/* 
        Contenedor Principal: 
        - Mobile: flex-col (se apila todo)
        - Medium (Tablets en adelante): flex-row items-center justify-between (¡Todo en una sola línea horizontal!)
      */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between max-w-7xl mx-auto w-full">

        {/* --- LOGO (A la izquierda en md+) --- */}
        <div className="flex items-center justify-between gap-4 w-full md:w-auto shrink-0">
          <Link href="/" className="flex items-center gap-1">
            <NextImage src="/img/lalista-logo.png" alt="Logo de LaLista" width={90} height={90} className="w-22 md:w-24 h-auto" />
          </Link>

          {/* Bloque Login Mobile (Solo se ve en pantallas realmente chicas, se oculta en md) */}
          <div className="flex items-center gap-2 md:hidden">
            {user ? (
              <div className="flex items-center gap-2 text-white text-xs font-medium">
                <span className="truncate max-w-[100px]">Hola, {user.name}</span>
                <button onClick={() => logout()} className="p-1.5 rounded-full bg-white/10">
                  <SignOutIcon className="text-base" />
                </button>
              </div>
            ) : (
              <Link href="/login" className="text-white text-xs font-semibold px-2">Entrar</Link>
            )}
          </div>
        </div>

        {/* --- CONTENEDOR CENTRAL: DIRECCIÓN + SLIDER --- 
          - md (Tablets): Se apilan verticalmente (flex-col items-center) ocupando el centro de la línea horizontal.
          - lg (Monitores): Se vuelven a poner uno al lado del otro (lg:flex-row) para aprovechar el ancho total.
        */}
        <div className="flex flex-col items-center justify-center gap-1.5 w-full md:flex-1 md:px-4 lg:flex-row lg:gap-3">
          
          {/* Selector de Dirección */}
          <div
            role="button"
            tabIndex={0}
            onClick={irAUbicacion}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                irAUbicacion();
              }
            }}
            className="flex min-w-0 w-full cursor-pointer items-center justify-between gap-2 rounded-lg bg-white/10 px-3 py-1.5 text-white border border-white/10 text-xs sm:text-sm sm:max-w-xs md:max-w-sm lg:max-w-sm transition hover:bg-white/20"
            aria-label="Cambiar ubicación"
          >
            <div className="flex items-center gap-1.5 min-w-0">
              <MapPinIcon className="text-base shrink-0 opacity-80" weight="regular" />
              <span className="truncate font-semibold text-white">
                {locationName || "Buscar ubicación..."}
              </span>
            </div>
            {onLimpiarUbicacion && (
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onLimpiarUbicacion();
                }}
                className="shrink-0 rounded-full p-0.5 transition hover:bg-white/20"
                aria-label="Limpiar ubicación"
              >
                <XIcon className="text-xs" weight="bold" />
              </button>
            )}
          </div>

          {/* Slider de Kilómetros */}
          {children && (
            <div className="w-full sm:w-44 shrink-0 flex items-center justify-center">
              {children}
            </div>
          )}
        </div>

        {/* --- AUTENTICACIÓN DERECHA (Disponible desde versión Medium / Tablet) --- */}
        <div className="hidden md:flex items-center gap-3 shrink-0">
          {user ? (
            <div className="flex items-center gap-2 text-white text-sm font-medium">
              <span>Hola, {user.name}</span>
              <button
                onClick={() => logout()}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 transition"
                aria-label="Cerrar sesión"
              >
                <SignOutIcon className="text-base" weight="regular" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login" className="text-white text-sm font-semibold hover:underline px-2">
                Entrar
              </Link>
              <Link href="/signup" className="text-white text-sm font-semibold hover:underline px-2">
                Registrarse
              </Link>
              <span className="p-2 rounded-full bg-white/10 border border-white/20 text-white inline-flex items-center justify-center">
                <UserIcon className="text-base" weight="regular" />
              </span>
            </div>
          )}
        </div>

      </div>
    </header>
  );
}