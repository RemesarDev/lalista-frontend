'use client';

import { useEffect, useRef, useState } from 'react';
import { EyeIcon, EyeSlashIcon, KeyIcon, XIcon } from '@phosphor-icons/react';
import { Button } from '@/app/_components/global/Button';
import { evaluarReglasPassword, PASSWORD_MAX } from '@/app/_lib/utils/reglasPassword';
import { traducirErrorAuth } from '@/app/_lib/utils/traductorAuth';

// Mismo cascaron que ModalBorrarCuenta (backdrop, tarjeta, header con X) y la
// misma lista de reglas que el registro y el reset, para que la clave se pida
// igual en las tres pantallas. El servidor vuelve a validar todo
// (auth-hardening.ts): esto es solo para avisar antes de enviar.

export type DatosCambioContrasena = {
    actual: string;
    nueva: string;
    cerrarOtrasSesiones: boolean;
};

interface ModalCambiarContrasenaProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (datos: DatosCambioContrasena) => Promise<{ success: boolean; error?: unknown }>;
}

type Campo = 'actual' | 'nueva' | 'repetir';
type Errores = Partial<Record<Campo | 'general', string>>;

// Componente de nivel de modulo (no declarado dentro del modal) para que React
// no lo remonte en cada tecla y el input no pierda el foco.
function CampoClave({
    id,
    label,
    valor,
    onChange,
    error,
    disabled,
    autoComplete,
    inputRef,
    onEnter,
}: {
    id: string;
    label: string;
    valor: string;
    onChange: (valor: string) => void;
    error?: string;
    disabled: boolean;
    autoComplete: 'current-password' | 'new-password';
    inputRef?: React.RefObject<HTMLInputElement | null>;
    onEnter: () => void;
}) {
    const [mostrar, setMostrar] = useState(false);

    return (
        <div>
            <label htmlFor={id} className="mb-1 block text-sm font-medium text-slate-700">{label}</label>
            <div className="relative">
                <input
                    id={id}
                    ref={inputRef}
                    type={mostrar ? 'text' : 'password'}
                    value={valor}
                    autoComplete={autoComplete}
                    maxLength={PASSWORD_MAX}
                    onChange={(e) => onChange(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && onEnter()}
                    disabled={disabled}
                    aria-invalid={Boolean(error)}
                    aria-describedby={error ? `${id}-error` : undefined}
                    className={`w-full rounded-2xl border bg-slate-50 px-4 py-3 pr-12 text-sm text-slate-900 outline-none transition focus:bg-white disabled:opacity-50 ${error ? 'border-red-400 focus:border-red-500' : 'border-slate-300 focus:border-slate-900'}`}
                />
                <button
                    type="button"
                    onClick={() => setMostrar(!mostrar)}
                    aria-label={mostrar ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition"
                >
                    {mostrar ? <EyeSlashIcon size={20} /> : <EyeIcon size={20} />}
                </button>
            </div>
            {error && (
                <p id={`${id}-error`} className="mt-1.5 text-xs text-red-600">{error}</p>
            )}
        </div>
    );
}

function codigoDe(error: unknown): string | undefined {
    if (!error || typeof error !== 'object') return undefined;
    const e = error as { code?: string; status?: number; body?: { code?: string } };
    if (e.status === 429) return 'RATE_LIMITED';
    return e.body?.code ?? e.code;
}

export function ModalCambiarContrasena({ isOpen, onClose, onConfirm }: ModalCambiarContrasenaProps) {
    const [actual, setActual] = useState('');
    const [nueva, setNueva] = useState('');
    const [repetir, setRepetir] = useState('');
    const [cerrarOtras, setCerrarOtras] = useState(true);
    const [errores, setErrores] = useState<Errores>({});
    const [enviando, setEnviando] = useState(false);
    const inputActualRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen) {
            setActual('');
            setNueva('');
            setRepetir('');
            setCerrarOtras(true);
            setErrores({});
            setEnviando(false);
            setTimeout(() => inputActualRef.current?.focus(), 100);
        }
    }, [isOpen]);

    // Con un error en la clave actual (vacia o rechazada por el servidor), el
    // foco vuelve a ese campo. Va en un efecto y no en el handler porque
    // mientras se envia el input esta deshabilitado y no acepta el foco.
    useEffect(() => {
        if (errores.actual && !enviando) inputActualRef.current?.focus();
    }, [errores.actual, enviando]);

    if (!isOpen) return null;

    const reglas = evaluarReglasPassword(nueva);

    const limpiarError = (campo: Campo) =>
        setErrores((prev) => ({ ...prev, [campo]: undefined, general: undefined }));

    const validar = (): Errores => {
        const e: Errores = {};
        if (!actual) e.actual = 'Ingresá tu contraseña actual.';
        if (!Object.values(reglas).every(Boolean)) {
            e.nueva = 'La contraseña nueva no cumple los requisitos.';
        } else if (nueva === actual) {
            e.nueva = 'La contraseña nueva tiene que ser distinta de la actual.';
        }
        if (!e.nueva && repetir !== nueva) e.repetir = 'Las contraseñas no coinciden.';
        return e;
    };

    const handleConfirm = async () => {
        if (enviando) return;
        const e = validar();
        if (Object.keys(e).length > 0) {
            setErrores(e);
            return;
        }

        setEnviando(true);
        const resultado = await onConfirm({ actual, nueva, cerrarOtrasSesiones: cerrarOtras });
        setEnviando(false);
        if (resultado.success) return;

        switch (codigoDe(resultado.error)) {
            case 'INVALID_PASSWORD':
                // En /change-password este codigo significa "la clave actual no coincide".
                setErrores({ actual: 'La contraseña actual no es correcta.' });
                return;
            case 'PASSWORD_TOO_WEAK':
            case 'PASSWORD_TOO_SHORT':
            case 'PASSWORD_TOO_LONG':
                setErrores({ nueva: traducirErrorAuth(resultado.error) });
                return;
            case 'RATE_LIMITED':
                setErrores({ general: 'Demasiados intentos. Esperá unos segundos y volvé a probar.' });
                return;
            default:
                setErrores({ general: traducirErrorAuth(resultado.error) });
        }
    };

    const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget && !enviando) onClose();
    };

    return (
        <div
            // z-[60]: la barra de navegacion inferior (Navigation.tsx) es z-50 y
            // se renderiza despues, asi que con z-50 tapaba los botones en el celular.
            className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm px-4 py-6 sm:py-0"
            onClick={handleBackdropClick}
        >
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="titulo-cambiar-contrasena"
                className="w-full max-w-md max-h-[calc(100dvh-3rem)] overflow-y-auto rounded-3xl bg-white shadow-xl border border-slate-200"
            >
                <div className="flex items-start justify-between p-6 pb-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-500 shrink-0">
                            <KeyIcon size={20} weight="regular" />
                        </div>
                        <div>
                            <h2 id="titulo-cambiar-contrasena" className="text-base font-bold text-slate-900">Cambiar contraseña</h2>
                            <p className="text-xs text-slate-400 mt-0.5">Primero confirmá la que usás hoy</p>
                        </div>
                    </div>
                    <Button variant="ghost" onClick={onClose} disabled={enviando} aria-label="Cerrar">
                        <XIcon size={20} weight="bold" />
                    </Button>
                </div>

                <div className="px-6 pb-6 space-y-4">
                    <CampoClave
                        id="clave-actual"
                        label="Contraseña actual"
                        valor={actual}
                        onChange={(v) => { setActual(v); limpiarError('actual'); }}
                        error={errores.actual}
                        disabled={enviando}
                        autoComplete="current-password"
                        inputRef={inputActualRef}
                        onEnter={handleConfirm}
                    />

                    <div>
                        <CampoClave
                            id="clave-nueva"
                            label="Contraseña nueva"
                            valor={nueva}
                            onChange={(v) => { setNueva(v); limpiarError('nueva'); }}
                            error={errores.nueva}
                            disabled={enviando}
                            autoComplete="new-password"
                            onEnter={handleConfirm}
                        />
                        <div className="mt-2 flex flex-col gap-1">
                            <span className={`text-xs flex items-center gap-1.5 transition-colors ${reglas.length ? 'text-green-600' : 'text-slate-500'}`}>
                                {reglas.length ? '✓' : '•'} Al menos 8 caracteres
                            </span>
                            <span className={`text-xs flex items-center gap-1.5 transition-colors ${reglas.upper ? 'text-green-600' : 'text-slate-500'}`}>
                                {reglas.upper ? '✓' : '•'} Una letra mayúscula
                            </span>
                            <span className={`text-xs flex items-center gap-1.5 transition-colors ${reglas.number ? 'text-green-600' : 'text-slate-500'}`}>
                                {reglas.number ? '✓' : '•'} Un número
                            </span>
                        </div>
                    </div>

                    <CampoClave
                        id="clave-repetir"
                        label="Repetí la contraseña nueva"
                        valor={repetir}
                        onChange={(v) => { setRepetir(v); limpiarError('repetir'); }}
                        error={errores.repetir}
                        disabled={enviando}
                        autoComplete="new-password"
                        onEnter={handleConfirm}
                    />

                    <label className="flex items-start gap-3 rounded-2xl bg-slate-50 border border-slate-200 px-4 py-3 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={cerrarOtras}
                            onChange={(e) => setCerrarOtras(e.target.checked)}
                            disabled={enviando}
                            className="mt-0.5 h-4 w-4 accent-slate-900"
                        />
                        <span className="text-xs text-slate-600">
                            <span className="font-semibold text-slate-800">Cerrar sesión en mis otros dispositivos.</span>{' '}
                            Recomendado si cambiás la clave porque alguien más pudo haberla visto.
                        </span>
                    </label>

                    {errores.general && (
                        <p role="alert" className="text-xs text-red-600">{errores.general}</p>
                    )}

                    <div className="flex flex-col gap-2 pt-1">
                        <Button
                            variant="primary"
                            fullWidth
                            onClick={handleConfirm}
                            disabled={enviando}
                            className="gap-2 rounded-2xl px-4 py-3"
                        >
                            <KeyIcon size={18} weight="bold" />
                            {enviando ? 'Guardando...' : 'Guardar contraseña nueva'}
                        </Button>
                        <Button
                            variant="secondary"
                            fullWidth
                            onClick={onClose}
                            disabled={enviando}
                            className="rounded-2xl px-4 py-3"
                        >
                            Cancelar
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
