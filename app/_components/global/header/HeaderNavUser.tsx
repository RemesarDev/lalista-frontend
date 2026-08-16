'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { SignOutIcon, UserIcon } from '@phosphor-icons/react/dist/ssr';
import { useListaStore } from '@/app/_store/store';

export default function HeaderUser() {
  const router = useRouter();
  const user = useListaStore((state) => state.user);
  const loadingAuth = useListaStore((state) => state.loadingAuth);
  const logout = useListaStore((state) => state.logout);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!menuOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    window.addEventListener('mousedown', handleClickOutside);
    return () => window.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  if (loadingAuth) {
    return (
      <div className="flex items-center gap-2 min-w-[92px] justify-end">
        <div className="h-8 w-20 rounded-full bg-white/10 animate-pulse border border-white/10" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <Link href="/login" className="text-white text-xs md:text-sm font-semibold hover:underline px-2">
          Entrar
        </Link>
        <Link href="/signup" className="hidden md:block text-white text-sm font-semibold hover:underline px-2">
          Registrarse
        </Link>
        <div className="hidden md:flex p-2 rounded-full bg-white/10 border border-white/20 text-white">
          <UserIcon className="text-base" />
        </div>
      </div>
    );
  }

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setMenuOpen((prev) => !prev)}
        className="flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-2 py-1.5 text-white transition hover:bg-white/15"
        aria-expanded={menuOpen}
        aria-haspopup="menu"
      >
        <span className="hidden md:block text-sm font-medium">Hola, {user.name}</span>
        <span className="md:hidden text-xs font-medium truncate max-w-[80px]">Hola, {user.name}</span>
        <span className="text-[10px] leading-none">▾</span>
      </button>

      {menuOpen && (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-2 w-44 rounded-2xl border border-slate-200 bg-white p-2 shadow-lg"
        >
          <Link
            href="/perfil"
            onClick={() => setMenuOpen(false)}
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
          >
            <UserIcon className="text-base" />
            Perfil
          </Link>

          <button
            type="button"
            onClick={async () => {
              await logout();
              setMenuOpen(false);
              router.replace('/');
            }}
            className="mt-1 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
          >
            <SignOutIcon className="text-base" />
            Cerrar sesión
          </button>
        </div>
      )}
    </div>
  );
}