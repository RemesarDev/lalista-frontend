'use client';

import { ReactNode } from 'react';

// Extraído de los botones de "vista" (Total / Por producto) en
// calculadora/page.tsx. Ahí este patrón ya se repetía 3 veces con la misma
// clase — solo cambiaba qué condición determinaba `active`.

interface FilterPillProps {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}

export function FilterPill({ active, onClick, children }: FilterPillProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 text-xs font-bold transition-all ${
        active
          ? 'border-transparent bg-primary-500 text-white'
          : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
      }`}
    >
      {children}
    </button>
  );
}
