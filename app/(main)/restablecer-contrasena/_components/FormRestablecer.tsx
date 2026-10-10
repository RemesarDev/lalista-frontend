'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { EyeIcon, EyeSlashIcon } from '@phosphor-icons/react';
import { authClient } from '@/app/_lib/auth-client';
import { traducirErrorAuth } from '@/app/_lib/utils/traductorAuth';
import { Button } from '@/app/_components/global/Button';
import { avisar } from '@/app/_lib/avisos';

// Mismas reglas que el registro (app/_lib/utils/validarRegistro.ts).
function evaluarReglas(password: string) {
    return {
        length: password.length >= 8,
        upper: /[A-Z]/.test(password),
        number: /[0-9]/.test(password),
    };
}

function LinkInvalido() {
    return (
        <div className="flex min-h-[60vh] items-center justify-center px-4 py-10">
            <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-sm border border-slate-200 text-center">
                <h1 className="text-2xl font-bold text-slate-900">El link no es válido</h1>
                <p className="mt-3 text-sm text-slate-600">
                    Puede que haya vencido (dura 1 hora) o que ya lo hayas usado. Pedí uno nuevo.
                </p>
                <div className="mt-6">
                    <Link href="/olvide-contrasena" className="font-semibold text-slate-900 hover:underline text-sm">
                        Pedir otro link
                    </Link>
                </div>
            </div>
        </div>
    );
}

export function FormRestablecer({ token }: { token: string | null }) {
    const router = useRouter();
    const [password, setPassword] = useState('');
    const [mostrarPass, setMostrarPass] = useState(false);
    const [guardando, setGuardando] = useState(false);
    const [mensajeError, setMensajeError] = useState('');
    const [tokenInvalido, setTokenInvalido] = useState(false);

    if (!token || tokenInvalido) return <LinkInvalido />;

    const reglas = evaluarReglas(password);

    const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
        e.preventDefault();
        setMensajeError('');

        if (!reglas.length || !reglas.upper || !reglas.number) {
            setMensajeError('La contraseña no cumple los requisitos.');
            return;
        }

        setGuardando(true);
        const { error } = await authClient.resetPassword({ newPassword: password, token });
        setGuardando(false);

        if (error) {
            if (error.code === 'INVALID_TOKEN') {
                setTokenInvalido(true);
                return;
            }
            setMensajeError(traducirErrorAuth(error));
            return;
        }

        avisar.exito('Listo: ya podés entrar con tu nueva contraseña');
        router.push('/login');
    };

    return (
        <div className="flex min-h-[60vh] items-center justify-center px-4 py-10">
            <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-sm border border-slate-200">
                <h1 className="text-2xl font-bold text-slate-900">Elegí una nueva contraseña</h1>
                <p className="mt-2 text-sm text-slate-600 mb-6">
                    Al guardarla se cierran las sesiones abiertas en otros dispositivos.
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="mb-1 block text-sm font-medium text-slate-700">Nueva contraseña</label>
                        <div className="relative">
                            <input
                                type={mostrarPass ? 'text' : 'password'}
                                required
                                autoComplete="new-password"
                                value={password}
                                onChange={(e) => {
                                    setPassword(e.target.value);
                                    setMensajeError('');
                                }}
                                className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 pr-12 text-sm text-slate-900 outline-none transition focus:border-slate-900 focus:bg-white"
                            />
                            <button
                                type="button"
                                onClick={() => setMostrarPass(!mostrarPass)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-900 focus:outline-none transition-colors"
                            >
                                {mostrarPass ? (
                                    <EyeSlashIcon size={22} weight="regular" />
                                ) : (
                                    <EyeIcon size={22} weight="regular" />
                                )}
                            </button>
                        </div>

                        <div className="mt-3 flex flex-col gap-1.5">
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

                    <Button type="submit" variant="primary" fullWidth disabled={guardando} className="mt-2">
                        {guardando ? 'Guardando...' : 'Guardar contraseña'}
                    </Button>

                    {mensajeError && (
                        <p className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 text-center">
                            {mensajeError}
                        </p>
                    )}
                </form>
            </div>
        </div>
    );
}
