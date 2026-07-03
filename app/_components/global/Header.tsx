'use client';

import Link from 'next/link';
import NextImage from 'next/image';
import { ReactNode } from 'react';
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

  return (
    <header className="w-full bg-primary-400 border-b border-accent-300 px-4 py-3 sticky top-0 z-50 shadow-sm">
      <div className="relative flex items-center gap-3 max-w-7xl mx-auto">

        {/* Logo a la izquierda */}
        <Link href="/" className="flex items-center gap-1 shrink-0">
          <NextImage src="/img/lalista-logo.png" alt="Logo de LaLista" width={60} height={60} />
        </Link>

        {/* Selector de ubicación centrado */}
        <div className="flex min-w-0 flex-1 items-center justify-center gap-1 md:absolute md:left-1/2 md:top-1/2 md:w-max md:flex-none md:-translate-x-1/2 md:-translate-y-1/2">
          <Link
            href="/ubicacion"
            className="flex min-w-0 max-w-full items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold font-sans text-white transition hover:bg-white/20 md:max-w-45"
          >
            <MapPinIcon className="text-white text-lg" weight="regular" />
            <span className="min-w-0 truncate">
              {locationName || "Ubicación pendiente"}
            </span>
          </Link>

          {onLimpiarUbicacion && (
            <button
              onClick={onLimpiarUbicacion}
              className="shrink-0 rounded-full border border-white/20 bg-white/10 p-1 text-white transition hover:bg-white/20"
              aria-label="Limpiar ubicación"
            >
              <XIcon weight="bold" className="text-xs" />
            </button>
          )}
        </div>

        {/* Acciones de usuario a la derecha */}
        <div className="ml-auto flex items-center gap-2 shrink-0">
          {user ? (
            <div className="flex items-center gap-3 text-white text-xs font-medium">
              <span>Hola, {user.name}</span>
              <button
                onClick={() => logout()}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 transition"
                aria-label="Cerrar sesión"
              >
                <SignOutIcon className="text-lg" weight="regular" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login" className="text-white text-xs font-semibold hover:underline px-2">
                Entrar
              </Link>
              <Link href="/signup" className="hidden sm:inline-flex text-white text-xs font-semibold hover:underline px-2">
                Registrarse
              </Link>
              <span className="p-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 transition text-white inline-flex items-center justify-center">
                <UserIcon className="text-lg" weight="regular" />
              </span>
            </div>
          )}
        </div>
      </div>

      {children && (
        <div className="mt-2 flex justify-center items-center">
          {children}
        </div>
      )}
    </header>
  );
}