'use client';

import { MapPinIcon, PlusIcon, XIcon, CheckCircleIcon, TrashIcon, CaretRightIcon } from '@phosphor-icons/react';
import { useListaStore } from '@/app/_store/store';
import { useDirecciones } from '@/app/_hooks/useDirecciones';
import type { DireccionGuardada } from '@/app/_types/direcciones';

interface DireccionSheetProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function DireccionSheet({ isOpen, onClose }: DireccionSheetProps) {
    const { ubicacion } = useListaStore();
    const {
        user,
        mostrarGuardadas,
        direccionesGuardadas,
        irAgregarDireccion,
        seleccionarDireccion,
        eliminarDireccion,
        limpiarUbicacion,
    } = useDirecciones(onClose);

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-slate-900/40 backdrop-blur-sm sm:p-4 md:pb-0 pb-14"
            onClick={onClose}
        >
            <div
                className="animate-sheet-up sm:[animation:none] w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl bg-white shadow-2xl max-h-[85svh] min-h-[38vh] sm:min-h-0 flex flex-col"
                role="dialog"
                aria-modal="true"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Drag handle — solo visible en móvil */}
                <div className="flex justify-center pt-3 pb-1 shrink-0 sm:hidden">
                    <div className="w-10 h-1.5 rounded-full bg-slate-200" />
                </div>

                {/* Header */}
                <div className="flex items-center justify-between px-6 pt-4 sm:pt-6 pb-3 shrink-0">
                    <h2 className="text-lg font-bold text-slate-900">Elegí tu dirección</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                        <XIcon size={20} weight="bold" />
                    </button>
                </div>

                {/* Lista scrollable */}
                <div className="flex-1 overflow-y-auto px-6">
                    {/* Direcciones guardadas (logueado con direcciones) */}
                    {mostrarGuardadas && (
                        <div className="divide-y divide-slate-100">
                            {direccionesGuardadas.map((dir: DireccionGuardada) => (
                                <button
                                    key={dir.id}
                                    onClick={() => seleccionarDireccion(dir)}
                                    className="flex items-center justify-between w-full py-3"
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <MapPinIcon
                                            size={20}
                                            weight="fill"
                                            className={dir.esActiva ? 'text-orange-500 shrink-0' : 'text-slate-400 shrink-0'}
                                        />
                                        <span className="text-sm font-semibold text-slate-900 truncate text-left">
                                            {dir.nombreLugar}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0 ml-2">
                                        {dir.esActiva && (
                                            <CheckCircleIcon size={22} className="text-emerald-600" weight="fill" />
                                        )}
                                        <span
                                            role="button"
                                            onClick={(e) => eliminarDireccion(e, dir.id)}
                                            className="p-1 rounded-full text-slate-300 hover:text-red-400 hover:bg-red-50 transition-colors"
                                        >
                                            <TrashIcon size={16} weight="bold" />
                                        </span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Dirección anónima — solo para no logueados */}
                    {!user && !mostrarGuardadas && ubicacion.nombreLugar && (
                        <div className="flex items-center justify-between w-full py-3 border-b border-slate-100">
                            <button
                                onClick={irAgregarDireccion}
                                className="flex items-center gap-3 min-w-0 flex-1 group"
                            >
                                <MapPinIcon size={20} className="text-orange-500 shrink-0" weight="fill" />
                                <span className="text-sm font-semibold text-slate-900 truncate">{ubicacion.nombreLugar}</span>
                                <CaretRightIcon size={16} className="text-slate-400 shrink-0 ml-1" weight="bold" />
                            </button>
                            <button
                                onClick={limpiarUbicacion}
                                className="p-1.5 rounded-full text-slate-300 hover:text-red-400 hover:bg-red-50 transition-colors ml-2 shrink-0"
                            >
                                <TrashIcon size={16} weight="bold" />
                            </button>
                        </div>
                    )}

                    {/* Sin direcciones aún */}
                    {!mostrarGuardadas && !ubicacion.nombreLugar && (
                        <p className="text-sm text-slate-400 py-4">Todavía no tenés ninguna dirección guardada.</p>
                    )}
                </div>

                {/* Botón fijo en el piso */}
                <div
                    className="shrink-0 px-6 pt-3 border-t border-slate-100"
                    style={{ paddingBottom: 'max(1.25rem, env(safe-area-inset-bottom))' }}
                >
                    <button
                        onClick={irAgregarDireccion}
                        className="flex items-center gap-3 w-full py-2.5 group"
                    >
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 group-hover:bg-orange-100 transition-colors shrink-0">
                            <PlusIcon size={16} className="text-slate-600 group-hover:text-orange-500" weight="bold" />
                        </div>
                        <span className="text-sm font-semibold text-slate-900">Agregar dirección</span>
                    </button>
                </div>
            </div>
        </div>
    );
}