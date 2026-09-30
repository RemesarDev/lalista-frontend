'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { TrashIcon, XIcon, EyeIcon, EyeSlashIcon } from '@phosphor-icons/react';
import { Button } from '@/app/_components/global/Button';

interface ModalBorrarCuentaProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (password: string) => Promise<void>;
    loading: boolean;
}

const FRASES = [
    'Tu lista nos va a extrañar. Mucho.',
    'Nos quedamos con tu lista hasta que volvás. 👀',
    'Podés arrepentirte. De hecho, contamos con eso.',
    '7 días. Estaremos acá. Esperando.',
];

export function ModalBorrarCuenta({ isOpen, onClose, onConfirm, loading }: ModalBorrarCuentaProps) {

    const [paso, setPaso] = useState<1 | 2>(1);
    const [password, setPassword] = useState('');
    const [mostrarPass, setMostrarPass] = useState(false);
    const [error, setError] = useState('');
    const [fraseIdx] = useState(() => Math.floor(Math.random() * FRASES.length));
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen) {
            setPaso(1);
            setPassword('');
            setError('');
            setMostrarPass(false);
        }
    }, [isOpen]);

    useEffect(() => {
        if (paso === 2) {
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [paso]);

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

                {paso === 1 ? (
                    /* ── Paso 1: Lali te retiene ── */
                    <div className="flex flex-col items-center px-6 pt-5 pb-8 text-center gap-4">

                        <div className="w-full flex justify-end">
                            <Button variant="ghost" onClick={onClose}>
                                <XIcon size={20} weight="bold" />
                            </Button>
                        </div>

                        <Image
                            src="/img/Lali-triste.png"
                            alt="Lali triste"
                            width={120}
                            height={120}
                            style={{ height: 'auto' }}
                            className="drop-shadow-md"
                            priority
                        />

                        <div className="space-y-1.5">
                            <h2 className="text-lg font-black text-slate-900">
                                ¿Borrar la cuenta?
                            </h2>
                            <p className="text-sm text-slate-500 max-w-xs mx-auto">
                                {FRASES[fraseIdx]}
                            </p>
                        </div>

                        <div className="w-full rounded-2xl bg-violet-50 border border-violet-100 px-4 py-3 text-left space-y-1">
                            <p className="text-xs font-bold text-violet-700">Antes de que lo hagas, sepas que...</p>
                            <p className="text-xs text-violet-600">
                                Tu cuenta <span className="font-semibold">no se borra de inmediato</span>. Tenés{' '}
                                <span className="font-semibold">7 días</span> para entrar de nuevo y cancelar.
                                Después de eso, adiós para siempre.
                            </p>
                        </div>

                        <div className="w-full flex flex-col gap-2 pt-1">
                            <Button
                                variant="secondary"
                                fullWidth
                                onClick={onClose}
                                className="rounded-2xl px-4 py-3 font-bold"
                            >
                                No, me quedo 🎉
                            </Button>
                            <button
                                onClick={() => setPaso(2)}
                                className="w-full text-sm text-slate-400 hover:text-slate-600 transition py-2"
                            >
                                Igual quiero borrarla
                            </button>
                        </div>

                    </div>
                ) : (
                    /* ── Paso 2: confirmación con contraseña ── */
                    <>
                        <div className="flex items-start justify-between p-6 pb-4">
                            <div className="flex items-center gap-3">
                                <Image
                                    src="/img/Lali-triste.png"
                                    alt="Lali triste"
                                    width={36}
                                    height={36}
                                    style={{ height: 'auto' }}
                                />
                                <div>
                                    <h2 className="text-base font-bold text-slate-900">Confirmá tu identidad</h2>
                                    <p className="text-xs text-slate-400 mt-0.5">Ingresá tu contraseña para continuar</p>
                                </div>
                            </div>
                            <Button variant="ghost" onClick={onClose} disabled={loading}>
                                <XIcon size={20} weight="bold" />
                            </Button>
                        </div>

                        <div className="px-6 pb-6 space-y-4">
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
                                        className={`w-full rounded-2xl border bg-slate-50 px-4 py-3 pr-12 text-sm text-slate-900 outline-none transition focus:bg-white disabled:opacity-50 ${error ? 'border-red-400 focus:border-red-500' : 'border-slate-300 focus:border-slate-900'}`}
                                    />
                                    {/* Ojito de contraseña: mismo caso que en login/page.tsx (hover:text-slate-700,
                                        no slate-600 como ghost) + posicionamiento absoluto propio. */}
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

                            <div className="flex flex-col gap-2 pt-1">
                                <Button
                                    variant="destructive"
                                    fullWidth
                                    onClick={handleConfirm}
                                    disabled={loading}
                                    className="gap-2 rounded-2xl px-4 py-3"
                                >
                                    <TrashIcon size={18} weight="bold" />
                                    {loading ? 'Programando eliminación...' : 'Borrar mi cuenta'}
                                </Button>
                                <Button
                                    variant="secondary"
                                    fullWidth
                                    onClick={() => setPaso(1)}
                                    disabled={loading}
                                    className="rounded-2xl px-4 py-3"
                                >
                                    Volver
                                </Button>
                            </div>
                        </div>
                    </>
                )}

            </div>
        </div>
    );
}