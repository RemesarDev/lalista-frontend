'use client';

import type { ReactNode } from 'react';
import {
  CheckCircleIcon,
  InfoIcon,
  TrashIcon,
  WarningCircleIcon,
  XIcon,
} from '@phosphor-icons/react';

export type TipoAviso = 'exito' | 'info' | 'deshacer' | 'error';

export interface AccionAviso {
  etiqueta: string;
  onClick: () => void;
}

interface AvisoProps {
  tipo: TipoAviso;
  mensaje: string;
  accion?: AccionAviso;
  /** Si viene, se muestra la X. Los errores la traen porque no se van solos. */
  onCerrar?: () => void;
}

const ICONOS: Record<TipoAviso, ReactNode> = {
  exito: <CheckCircleIcon size={20} weight="fill" className="text-accent-600" />,
  info: <InfoIcon size={20} weight="fill" className="text-slate-400" />,
  deshacer: <TrashIcon size={20} weight="regular" className="text-slate-400" />,
  error: <WarningCircleIcon size={20} weight="fill" className="text-red-500" />,
};

/**
 * Tarjeta de un aviso flotante (toast). Solo dibuja: no se usa directo,
 * se muestra con `avisar` (app/_lib/avisos.tsx).
 *
 * Mismo lenguaje visual que AvisoComparar: blanco, borde suave, esquinas
 * redondeadas y sombra, para que todos los avisos flotantes se vean igual.
 */
export function Aviso({ tipo, mensaje, accion, onCerrar }: AvisoProps) {
  const esError = tipo === 'error';

  return (
    <div
      className={`flex w-full items-center gap-3 rounded-2xl border px-3.5 py-3 shadow-lg ${
        esError ? 'border-red-200 bg-red-50' : 'border-accent-300 bg-white'
      }`}
    >
      <span className="shrink-0" aria-hidden="true">
        {ICONOS[tipo]}
      </span>

      <p
        className={`line-clamp-2 min-w-0 flex-1 text-sm font-medium leading-snug ${
          esError ? 'text-red-800' : 'text-slate-800'
        }`}
      >
        {mensaje}
      </p>

      {accion && (
        <button
          type="button"
          onClick={accion.onClick}
          className={`shrink-0 rounded-lg px-2 py-1 text-sm font-bold transition ${
            esError ? 'text-red-700 hover:bg-red-100' : 'text-purple-600 hover:bg-purple-50'
          }`}
        >
          {accion.etiqueta}
        </button>
      )}

      {onCerrar && (
        <button
          type="button"
          onClick={onCerrar}
          aria-label="Cerrar aviso"
          className="shrink-0 rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
        >
          <XIcon size={14} weight="bold" />
        </button>
      )}
    </div>
  );
}
