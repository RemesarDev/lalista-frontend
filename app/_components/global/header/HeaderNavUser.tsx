'use client';

import Link from 'next/link';
import { SignOutIcon, UserIcon } from '@phosphor-icons/react/dist/ssr';
import { useListaStore } from '@/app/_store/store';

export default function HeaderUser() {
  const user = useListaStore((state) => state.user);
  const logout = useListaStore((state) => state.logout);

  return (
    <>
      {/* Este componente se renderiza igual, pero usamos clases de Tailwind 
        para cambiar el diseño según el breakpoint. 
      */}
      {user ? (
        <div className="flex items-center gap-2 text-white font-medium">
          {/* Nombre visible solo en desktop */}
          <span className="hidden md:block text-sm">Hola, {user.name}</span>
          {/* Nombre truncado en mobile */}
          <span className="md:hidden text-xs truncate max-w-[80px]">Hola, {user.name}</span>
          
          <button 
            onClick={() => logout()} 
            className="p-1.5 md:p-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 transition"
          >
            <SignOutIcon className="text-base" />
          </button>
        </div>
      ) : (
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
      )}
    </>
  );
}