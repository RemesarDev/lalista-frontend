// app/_components/global/ConfirmModal.tsx
'use client';

import { ReactNode } from 'react';
import { WarningCircleIcon, XIcon } from '@phosphor-icons/react'; // Ajustá los íconos si es necesario

interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    titulo: string;
    mensaje: ReactNode;
    textoConfirmar?: string;
    textoCancelar?: string;
    isDestructive?: boolean;
}

export default function ConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    titulo,
    mensaje,
    textoConfirmar = 'Confirmar',
    textoCancelar = 'Cancelar',
    isDestructive = true,
}: ConfirmModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
            <div 
                className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl animate-in fade-in zoom-in-95 duration-200"
                role="dialog"
                aria-modal="true"
            >
                <div className="flex items-start justify-between mb-4">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-full ${isDestructive ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'}`}>
                        <WarningCircleIcon size={24} weight="regular" />
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                        <XIcon size={20} weight="bold" />
                    </button>
                </div>

                <h2 className="text-lg font-bold text-slate-900">{titulo}</h2>
                <p className="mt-2 text-sm text-slate-500">{mensaje}</p>

                <div className="mt-6 flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-200 transition-colors"
                    >
                        {textoCancelar}
                    </button>
                    <button
                        onClick={() => {
                            onConfirm();
                            onClose();
                        }}
                        className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-colors ${
                            isDestructive ? 'bg-red-500 hover:bg-red-600' : 'bg-orange-500 hover:bg-orange-600'
                        }`}
                    >
                        {textoConfirmar}
                    </button>
                </div>
            </div>
        </div>
    );
}