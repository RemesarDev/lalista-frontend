// app/_components/global/ModalLimite.tsx
'use client';

import { WarningCircleIcon, XIcon } from '@phosphor-icons/react';
import { useListaStore } from '@/app/_store/store';

export default function ModalLimite() {
  const { modalLimite, cerrarModalLimite } = useListaStore();

  if (!modalLimite.isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-fadeIn"
      onClick={cerrarModalLimite}
    >
      <div 
        className="w-full max-w-sm rounded-3xl bg-white shadow-2xl p-6 flex flex-col items-text text-center transform transition-all animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Icono de advertencia */}
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-amber-600 mb-4 shadow-inner">
          <WarningCircleIcon size={32} weight="fill" />
        </div>

        {/* Título */}
        <h3 className="text-lg font-bold text-slate-900 mb-2">
          ¡Límite alcanzado!
        </h3>

        {/* Mensaje dinámico que viene del backend / constantes */}
        <p className="text-sm text-slate-600 mb-6 leading-relaxed">
          {modalLimite.mensaje}
        </p>

        {/* Botón de acción */}
        <button
          onClick={cerrarModalLimite}
          className="w-full py-3 px-4 rounded-2xl bg-slate-900 text-white font-semibold text-sm hover:bg-slate-800 active:scale-95 transition-all shadow-lg"
        >
          Entendido
        </button>
      </div>
    </div>
  );
}