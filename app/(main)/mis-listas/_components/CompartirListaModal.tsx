// app/(main)/mis-listas/_components/CompartirListaModal.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { CheckCircleIcon, XIcon, ShareNetworkIcon } from '@phosphor-icons/react';
import type { UsuarioPublico } from '@/app/_types/usuarios';

interface CompartirListaModalProps {
    isOpen: boolean;
    onClose: () => void;
    listaId: string | null;
}

export function CompartirListaModal({ isOpen, onClose, listaId }: CompartirListaModalProps) {
    const [email, setEmail] = useState('');
    const [rol, setRol] = useState<'viewer' | 'editor'>('viewer');
    const [sugerencias, setSugerencias] = useState<UsuarioPublico[]>([]);
    const [usuarioSeleccionado, setUsuarioSeleccionado] = useState<UsuarioPublico | null>(null);
    const [cargandoSugerencias, setCargandoSugerencias] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [exito, setExito] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        if (isOpen) {
            setEmail('');
            setRol('viewer');
            setSugerencias([]);
            setUsuarioSeleccionado(null);
            setError(null);
            setExito(false);
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isOpen]);

    useEffect(() => {
        if (usuarioSeleccionado) return;
        if (email.length < 5) {
            setSugerencias([]);
            return;
        }

        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(async () => {
            setCargandoSugerencias(true);
            try {
                const res = await fetch(`/api/usuarios?email=${encodeURIComponent(email)}`, {
                    credentials: 'include',
                });
                if (!res.ok) return;
                const json = await res.json();
                setSugerencias(json.usuarios ?? []);
            } catch {
                setSugerencias([]);
            } finally {
                setCargandoSugerencias(false);
            }
        }, 400);
    }, [email, usuarioSeleccionado]);

    if (!isOpen) return null;

    const handleSeleccionar = (usuario: UsuarioPublico) => {
        setUsuarioSeleccionado(usuario);
        setEmail(usuario.email);
        setSugerencias([]);
    };

    const handleCompartir = async () => {
        if (!usuarioSeleccionado || !listaId) return;
        setLoading(true);
        setError(null);

        try {
            const res = await fetch(`/api/listas/${listaId}/miembros`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: usuarioSeleccionado.id, rol }),
            });

            const json = await res.json();
            if (!res.ok) throw new Error(json.error ?? 'Error al compartir');

            setExito(true);
            setTimeout(() => onClose(), 1500);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
            <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl" role="dialog" aria-modal="true">

                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-lila-100 text-lila-600 bg-purple-100 text-purple-600">
                        <ShareNetworkIcon size={20} weight="regular" />
                    </div>
                    <button onClick={onClose} disabled={loading} className="text-slate-400 hover:text-slate-600 disabled:opacity-50">
                        <XIcon size={20} weight="bold" />
                    </button>
                </div>

                <h2 className="text-lg font-bold text-slate-900">Compartir lista</h2>
                <p className="mt-1 mb-4 text-sm text-slate-500">Ingresá el email del usuario con quien querés compartir.</p>

                {/* Input de email */}
                <div className="relative">
                    <input
                        ref={inputRef}
                        type="email"
                        value={email}
                        onChange={(e) => {
                            setEmail(e.target.value);
                            setUsuarioSeleccionado(null);
                            setError(null);
                            setExito(false);
                        }}
                        disabled={loading}
                        placeholder="email@ejemplo.com"
                        className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:bg-white focus:border-slate-900 disabled:opacity-50"
                    />

                    {/* Sugerencias */}
                    {sugerencias.length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-1 rounded-2xl border border-slate-200 bg-white shadow-lg z-10 overflow-hidden">
                            {sugerencias.map((u) => (
                                <button
                                    key={u.id}
                                    onClick={() => handleSeleccionar(u)}
                                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors text-left"
                                >
                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 shrink-0">
                                        {u.imagen ? (
                                            <img src={u.imagen} alt={u.nombre} className="h-8 w-8 rounded-full object-cover" />
                                        ) : (
                                            <img
                                                src="/img/avatar-default.png"
                                                alt={`${u.nombre} sin imagen de perfil`}
                                                className="h-8 w-8 rounded-full object-cover"
                                            />
                                        )}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-semibold text-slate-900 truncate">{u.nombre}</p>
                                        <p className="text-xs text-slate-400 truncate">{u.email}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}

                    {cargandoSugerencias && (
                        <div className="absolute right-4 top-1/2 -translate-y-1/2">
                            <span className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin block" />
                        </div>
                    )}
                </div>

                {/* Selector de rol */}
                {usuarioSeleccionado && (
                    <div className="mt-4">
                        <label className="mb-1 block text-sm font-medium text-slate-700">Rol</label>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setRol('viewer')}
                                className={`flex-1 rounded-xl py-2 text-sm font-semibold transition-colors border ${rol === 'viewer'
                                    ? 'bg-slate-900 text-white border-slate-900'
                                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                                    }`}
                            >
                                Lector
                            </button>
                            <button
                                onClick={() => setRol('editor')}
                                className={`flex-1 rounded-xl py-2 text-sm font-semibold transition-colors border ${rol === 'editor'
                                    ? 'bg-slate-900 text-white border-slate-900'
                                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                                    }`}
                            >
                                Editor
                            </button>
                        </div>
                    </div>
                )}

                {error && (
                    <p className="mt-3 text-xs text-red-600">{error}</p>
                )}

                {exito && (
                    <p className="mt-3 flex items-center gap-1 text-xs text-green-600 font-medium">
                        <CheckCircleIcon size={16} weight="fill" />
                        Lista compartida correctamente
                    </p>
                )}

                {/* Botones */}
                <div className="mt-6 flex flex-col gap-2">
                    <button
                        onClick={handleCompartir}
                        disabled={!usuarioSeleccionado || loading}
                        className="w-full flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 transition-colors disabled:opacity-50"
                    >
                        <ShareNetworkIcon size={16} weight="bold" />
                        {loading ? 'Compartiendo...' : 'Compartir'}
                    </button>
                    <button
                        onClick={onClose}
                        disabled={loading}
                        className="w-full rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-200 transition-colors disabled:opacity-50"
                    >
                        Cancelar
                    </button>
                </div>
            </div>
        </div>
    );
}