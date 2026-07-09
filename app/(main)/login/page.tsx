'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useListaStore } from '@/app/_store/store';
import { traducirErrorAuth } from '@/app/_lib/utils/traductorAuth';
import { EyeIcon, EyeSlashIcon } from '@phosphor-icons/react'; // Importamos los íconos

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [mostrarPass, setMostrarPass] = useState(false);
    const [mensajeError, setMensajeError] = useState("");

    const login = useListaStore((state) => state.loginConEmail);
    const loading = useListaStore((state) => state.loadingAuth);

    const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
        e.preventDefault();
        setMensajeError("");

        if (!email || !password) {
            setMensajeError("Por favor, completá todos los campos.");
            return;
        }

        const result = await login(email, password);

        if (result.success) {
            router.push('/');
        } else {
            setMensajeError(traducirErrorAuth(result.error?.message));
        }
    };

    return (
        <div className="flex min-h-[60vh] items-center justify-center px-4 py-10">
            <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-sm border border-slate-200">
                <h1 className="text-2xl font-bold text-slate-900">Iniciar sesión</h1>
                <p className="mt-2 text-sm text-slate-600 mb-6">
                    Accedé a tu cuenta para guardar ubicación, comparar precios y usar tu lista.
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Campo: Email */}
                    <div>
                        <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => {
                                setEmail(e.target.value);
                                setMensajeError("");
                            }}
                            className={`w-full rounded-2xl border bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:bg-white ${mensajeError && !email ? 'border-red-500 focus:border-red-500' : 'border-slate-300 focus:border-slate-900'
                                }`}
                        />
                    </div>

                    {/* Campo: Contraseña con ícono Phosphor */}
                    <div>
                        <label className="mb-1 block text-sm font-medium text-slate-700">Contraseña</label>
                        <div className="relative">
                            <input
                                type={mostrarPass ? "text" : "password"}
                                required
                                value={password}
                                onChange={(e) => {
                                    setPassword(e.target.value);
                                    setMensajeError("");
                                }}
                                // Cambié pr-16 a pr-12 porque el ícono ocupa menos espacio que la palabra "Ocultar"
                                className={`w-full rounded-2xl border bg-slate-50 px-4 py-3 pr-12 text-sm text-slate-900 outline-none transition focus:bg-white ${mensajeError && !password ? 'border-red-500 focus:border-red-500' : 'border-slate-300 focus:border-slate-900'
                                    }`}
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
                    </div>

                    {/* Botón Submit */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full mt-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
                    >
                        {loading ? "Entrando..." : "Entrar"}
                    </button>

                    {/* Mensaje de Error Visual */}
                    {mensajeError && (
                        <p className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 text-center">
                            {mensajeError}
                        </p>
                    )}
                </form>

                <div className="mt-6 flex items-center justify-center gap-2 text-sm text-slate-600">
                    <span>¿No tenés cuenta?</span>
                    <Link href="/signup" className="font-semibold text-slate-900 hover:underline">
                        Crear cuenta
                    </Link>
                </div>
            </div>
        </div>
    );
}