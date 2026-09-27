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
    } = useDirecciones(onClose);

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4"
            onClick={onClose}
        >
            <div
                className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto"
                role="dialog"
                aria-modal="true"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-slate-900">Elegí tu dirección</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                        <XIcon size={20} weight="bold" />
                    </button>
                </div>

                {/* Direcciones guardadas (logueado con direcciones) */}
                {mostrarGuardadas && (
                    <div className="mb-2 divide-y divide-slate-100">
                        {direccionesGuardadas.map((dir: DireccionGuardada) => (
                            <button
                                key={dir.id}
                                onClick={() => seleccionarDireccion(dir)}
                                className="flex items-center justify-between w-full py-3 group"
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

                {/* Dirección anónima con ubicación */}
                {!mostrarGuardadas && ubicacion.nombreLugar && (
                    <button
                        onClick={irAgregarDireccion}
                        className="flex items-center justify-between w-full py-3 border-b border-slate-100 mb-2 group"
                    >
                        <div className="flex items-center gap-3 min-w-0">
                            <MapPinIcon size={20} className="text-orange-500 shrink-0" weight="fill" />
                            <span className="text-sm font-semibold text-slate-900 truncate">{ubicacion.nombreLugar}</span>
                        </div>
                        <CaretRightIcon size={16} className="text-slate-400 shrink-0 ml-2" weight="bold" />
                    </button>
                )}

                {/* Sin direcciones aún (anónimo sin ubicación o logueado sin guardadas) */}
                {!mostrarGuardadas && !ubicacion.nombreLugar && (
                    <button
                        onClick={irAgregarDireccion}
                        className="flex items-center gap-3 w-full py-3 group"
                    >
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 group-hover:bg-orange-100 transition-colors shrink-0">
                            <PlusIcon size={16} className="text-slate-600 group-hover:text-orange-500" weight="bold" />
                        </div>
                        <div className="text-left">
                            <p className="text-sm font-semibold text-slate-900">Añadir dirección</p>
                            <p className="text-xs text-slate-400">Ingresá una dirección para ver precios cercanos.</p>
                        </div>
                    </button>
                )}

                {/* Más opciones — solo logueados */}
                {!!user && (
                    <div className="border-t border-slate-100 mt-4 pt-4">
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
                            Más opciones
                        </p>
                        <button
                            onClick={irAgregarDireccion}
                            className="flex items-center gap-3 w-full py-3 group"
                        >
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 group-hover:bg-orange-100 transition-colors shrink-0">
                                <PlusIcon size={16} className="text-slate-600 group-hover:text-orange-500" weight="bold" />
                            </div>
                            <div className="text-left">
                                <p className="text-sm font-semibold text-slate-900">Agregar dirección</p>
                                <p className="text-xs text-slate-400">Ingresá una nueva dirección de entrega.</p>
                            </div>
                        </button>
                    </div>
                )}

            </div>
        </div>
    );
}