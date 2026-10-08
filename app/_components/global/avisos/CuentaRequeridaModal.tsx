'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { UserPlusIcon, XIcon } from '@phosphor-icons/react/dist/ssr';

interface CuentaRequeridaModalProps {
  isOpen: boolean;
  onClose: () => void;
  redirectTo?: string;
}

export function CuentaRequeridaModal({
  isOpen,
  onClose,
  redirectTo = '/mi-lista',
}: CuentaRequeridaModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const next = encodeURIComponent(redirectTo);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="cuenta-requerida-titulo"
        className="relative w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="Cerrar"
          className="absolute right-3 top-3 rounded-full p-1 text-slate-400 transition-colors hover:text-slate-600"
        >
          <XIcon size={18} weight="bold" />
        </button>

        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-orange-50 text-orange-500">
          <UserPlusIcon size={24} weight="bold" />
        </div>

        <h2 id="cuenta-requerida-titulo" className="mt-4 text-base font-black text-slate-900">
          Necesitás una cuenta para guardar tu lista
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Creá tu cuenta gratis para guardar tus listas, volver a verlas cuando quieras y
          compartirlas. Mientras tanto, tu lista actual sigue acá.
        </p>

        <div className="mt-5 flex flex-col gap-2">
          <Link
            href={`/signup?redirect=${next}`}
            className="rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-orange-600"
          >
            Crear cuenta
          </Link>
          <Link
            href={`/login?redirect=${next}`}
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-600 transition-colors hover:border-orange-300 hover:text-orange-600"
          >
            Ya tengo cuenta
          </Link>
          <button
            onClick={onClose}
            className="mt-1 text-xs font-medium text-slate-400 transition-colors hover:text-slate-600"
          >
            Ahora no
          </button>
        </div>
      </div>
    </div>
  );
}