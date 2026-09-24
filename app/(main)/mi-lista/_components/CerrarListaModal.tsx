// app/(main)/mi-lista/_components/CerrarListaModal.tsx
'use client';

import { XIcon, WarningCircleIcon, FloppyDiskIcon, DoorOpenIcon } from '@phosphor-icons/react';
import { Button } from '@/app/_components/global/Button';

interface CerrarListaModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCerrarSinGuardar: () => void;
    onSincronizarYCerrar: () => void;
    loading: boolean;
}

export function CerrarListaModal({
    isOpen,
    onClose,
    onCerrarSinGuardar,
    onSincronizarYCerrar,
    loading,
}: CerrarListaModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
            <div
                className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl animate-in fade-in zoom-in-95 duration-200"
                role="dialog"
                aria-modal="true"
            >
                <div className="flex items-start justify-between mb-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 text-orange-600">
                        <WarningCircleIcon size={24} weight="regular" />
                    </div>
                    <Button variant="ghost" onClick={onClose} disabled={loading}>
                        <XIcon size={20} weight="bold" />
                    </Button>
                </div>

                <h2 className="text-lg font-bold text-slate-900">¿Cerrar lista?</h2>
                <p className="mt-2 text-sm text-slate-500">
                    Tenés cambios sin sincronizar. ¿Querés guardarlos en la nube antes de cerrar?
                </p>

                <div className="mt-6 flex flex-col gap-2">
                    <Button
                        variant="primary"
                        fullWidth
                        onClick={onSincronizarYCerrar}
                        disabled={loading}
                        className="gap-2 rounded-xl px-4 py-2.5"
                    >
                        <FloppyDiskIcon size={16} weight="bold" />
                        {loading ? 'Sincronizando...' : 'Sincronizar y cerrar'}
                    </Button>

                    {/* Sin migrar a propósito: bg-slate-100 no matchea ningún variant
                        actual de Button (es el "patrón muted" pendiente de definir). */}
                    <button
                        onClick={onCerrarSinGuardar}
                        disabled={loading}
                        className="w-full flex items-center justify-center gap-2 rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-200 transition-colors disabled:opacity-50"
                    >
                        <DoorOpenIcon size={16} weight="bold" />
                        Cerrar sin guardar
                    </button>

                    <Button
                        variant="ghost"
                        fullWidth
                        onClick={onClose}
                        disabled={loading}
                        className="rounded-xl px-4 py-2.5"
                    >
                        Cancelar
                    </Button>
                </div>
            </div>
        </div>
    );
}