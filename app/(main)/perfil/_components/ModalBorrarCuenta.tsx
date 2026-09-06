'use client';

import { useState, useRef, useEffect } from 'react';
import { TrashIcon, XIcon, EyeIcon, EyeSlashIcon, WarningIcon } from '@phosphor-icons/react';

interface ModalBorrarCuentaProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (password: string) => Promise<void>;
    loading: boolean;
}

export function ModalBorrarCuenta({ isOpen, onClose, onConfirm, loading }: ModalBorrarCuentaProps) {
    const [password, setPassword] = useState('');
    const [mostrarPass, setMostrarPass] = useState(false);
    const [error, setError] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen) {
            setPassword('');
            setError('');
            setMostrarPass(false);
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleConfirm = async () => {
        if (!password.trim()) {
            setError('Ingresá tu contraseña para confirmar.');
            return;
        }
        setError('');
        await onConfirm(password);
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
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-50 text-red-500 shrink-0">
                            <WarningIcon size={20} weight="fill" />
                        </div>
                        <div>
                            <h2 className="text-base font-bold text-slate-900">Borrar cuenta</h2>
                            <p className="text-xs text-slate-400 mt-0.5">Esta acción no se puede deshacer</p>
                        </div>
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
                    <p className="text-sm text-slate-600">
                        Se eliminarán permanentemente tu cuenta y todos tus datos. Ingresá tu contraseña para confirmar.
                    </p>

                    {/* Input contraseña */}
                    <div>
                        <label className="mb-1 block text-sm font-medium text-slate-700">Contraseña</label>
                        <div className="relative">
                            <input
                                ref={inputRef}
                                type={mostrarPass ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => {
                                    setPassword(e.target.value);
                                    setError('');
                                }}
                                onKeyDown={(e) => e.key === 'Enter' && handleConfirm()}
                                disabled={loading}
                                className={`w-full rounded-2xl border bg-slate-50 px-4 py-3 pr-12 text-sm text-slate-900 outline-none transition focus:bg-white disabled:opacity-50 ${error ? 'border-red-400 focus:border-red-500' : 'border-slate-300 focus:border-slate-900'
                                    }`}
                            />
                            <button
                                type="button"
                                onClick={() => setMostrarPass(!mostrarPass)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition"
                            >
                                {mostrarPass ? <EyeSlashIcon size={20} /> : <EyeIcon size={20} />}
                            </button>
                        </div>
                        {error && (
                            <p className="mt-1.5 text-xs text-red-600">{error}</p>
                        )}
                    </div>

                    {/* Botones */}
                    <div className="flex flex-col gap-2 pt-1">
                        <button
                            onClick={handleConfirm}
                            disabled={loading}
                            className="w-full flex items-center justify-center gap-2 rounded-2xl bg-red-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
                        >
                            <TrashIcon size={18} weight="bold" />
                            {loading ? 'Borrando cuenta...' : 'Sí, borrar mi cuenta'}
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