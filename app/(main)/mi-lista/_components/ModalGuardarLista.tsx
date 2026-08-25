// app/(main)/mi-lista/_components/ModalGuardarLista.tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import { FloppyDiskIcon, XIcon } from '@phosphor-icons/react';

interface ModalGuardarListaProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (nombre: string) => Promise<void>;
    loading: boolean;
}

export function ModalGuardarLista({ isOpen, onClose, onConfirm, loading }: ModalGuardarListaProps) {
    const [nombre, setNombre] = useState('');
    const [error, setError] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen) {
            setNombre('');
            setError('');
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleConfirm = async () => {
        if (!nombre.trim()) {
            setError('Ingresá un nombre para la lista.');
            return;
        }
        setError('');
        await onConfirm(nombre.trim());
    };

    const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) onClose();
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm px-4 pb-6 sm:pb-0"
            onClick={handleBackdropClick}
        >
            <div className="w-full max-w-md rounded-3xl bg-white shadow-xl border border-slate-200 overflow-hidden">

                {/* Header */}
                <div className="flex items-start justify-between p-6 pb-4">
                    <div>
                        <h2 className="text-base font-bold text-slate-900">Guardar lista</h2>
                        <p className="text-xs text-slate-400 mt-0.5">Se guardará en tu cuenta</p>
                    </div>
                    <button
                        onClick={onClose}
                        disabled={loading}
                        className="text-slate-400 hover:text-slate-600 transition disabled:opacity-50"
                    >
                        <XIcon size={20} weight="bold" />
                    </button>
                </div>

                {/* Body */}
                <div className="px-6 pb-6 space-y-4">
                    <div>
                        <label className="mb-1 block text-sm font-medium text-slate-700">Nombre</label>
                        <input
                            ref={inputRef}
                            type="text"
                            value={nombre}
                            onChange={(e) => { setNombre(e.target.value); setError(''); }}
                            onKeyDown={(e) => e.key === 'Enter' && handleConfirm()}
                            disabled={loading}
                            placeholder="Ej: Lista del super"
                            className={`w-full rounded-2xl border bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:bg-white disabled:opacity-50 ${error ? 'border-red-400 focus:border-red-500' : 'border-slate-300 focus:border-slate-900'
                                }`}
                        />
                        {error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}
                    </div>

                    <div className="flex flex-col gap-2 pt-1">
                        <button
                            onClick={handleConfirm}
                            disabled={loading}
                            className="w-full flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
                        >
                            <FloppyDiskIcon size={18} weight="bold" />
                            {loading ? 'Guardando...' : 'Guardar lista'}
                        </button>
                        <button
                            onClick={onClose}
                            disabled={loading}
                            className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                        >
                            Cancelar
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
}