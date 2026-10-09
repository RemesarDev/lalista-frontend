'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useListaStore } from '@/app/_store/store';
import { useSignupForm } from './_hooks/useSignupForm';
import { traducirErrorAuth } from '@/app/_lib/utils/traductorAuth';
import { Button } from '@/app/_components/global/Button';
import { avisar } from '@/app/_lib/avisos';
import { EyeIcon, EyeSlashIcon } from '@phosphor-icons/react';

export default function SignupPage() {
    const router = useRouter();
    const [mensajeError, setMensajeError] = useState('');
    const [mostrarPass, setMostrarPass] = useState(false);
    const [emailPendienteVerificar, setEmailPendienteVerificar] = useState('');

    // 1. Extraemos todo de nuestro custom hook
    const { form, erroresTexto, reglasPass, manejarInput, validarSubmit } = useSignupForm();

    // 2. Accedemos a la acción de registro y al estado de carga desde el store
    const registro = useListaStore((state) => state.registroConEmail);
    const loading = useListaStore((state) => state.loadingAuth);

    const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
        e.preventDefault();
        setMensajeError('');

        // 3. Ejecutamos la validación de Zod antes de tocar la API
        const esValido = await validarSubmit();
        if (!esValido) return;

        // 4. Si Zod da luz verde, enviamos a Better Auth (Zustand)
        // Nota: Pasamos form.nombre porque así lo definiste en Zod
        const result = await registro(form.email, form.password, form.nombre);

        if (result.requiereVerificacion) {
            setEmailPendienteVerificar(form.email);
        } else if (result.success) {
            const nombre = form.nombre.trim().split(/\s+/)[0];
            avisar.exito(nombre ? `Listo, ${nombre}: ya tenés tu cuenta` : 'Listo: ya tenés tu cuenta');
            router.push('/');
        } else {
            setMensajeError(traducirErrorAuth(result.error));
        }
    };

    if (emailPendienteVerificar) {
        return (
            <div className="flex min-h-[60vh] items-center justify-center px-4 py-10">
                <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-sm border border-slate-200 text-center">
                    <h1 className="text-2xl font-bold text-slate-900">¡Ya casi!</h1>
                    <p className="mt-3 text-sm text-slate-600">
                        Te mandamos un mail a <span className="font-semibold text-slate-900">{emailPendienteVerificar}</span> para confirmar tu cuenta. Abrí el link de ahí para poder iniciar sesión.
                    </p>
                    <p className="mt-4 text-xs text-slate-500">
                        ¿No te llegó? Revisá también la carpeta de spam.
                    </p>
                    <div className="mt-6 text-sm text-slate-600">
                        <Link href="/login" className="font-semibold text-slate-900 hover:underline">
                            Ir a iniciar sesión
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-[60vh] items-center justify-center px-4 py-10">
            <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-sm border border-slate-200">
                <h1 className="text-2xl font-bold text-slate-900">Crear cuenta</h1>
                <p className="mt-2 text-sm text-slate-600 mb-6">
                    Completá tus datos para empezar a ahorrar.
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Campo: Nombre */}
                    <div>
                        <label className="mb-1 block text-sm font-medium text-slate-700">Nombre</label>
                        <input
                            type="text"
                            value={form.nombre}
                            onChange={(e) => manejarInput('nombre', e.target.value)}
                            className={`w-full rounded-2xl border bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:bg-white ${erroresTexto.nombre ? 'border-red-500 focus:border-red-500' : 'border-slate-300 focus:border-slate-900'
                                }`}
                        />
                        {erroresTexto.nombre && (
                            <p className="mt-1.5 text-xs text-red-500">{erroresTexto.nombre[0]}</p>
                        )}
                    </div>

                    {/* Campo: Email */}
                    <div>
                        <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
                        <input
                            type="email"
                            value={form.email}
                            onChange={(e) => manejarInput('email', e.target.value)}
                            className={`w-full rounded-2xl border bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:bg-white ${erroresTexto.email ? 'border-red-500 focus:border-red-500' : 'border-slate-300 focus:border-slate-900'
                                }`}
                        />
                        {erroresTexto.email && (
                            <p className="mt-1.5 text-xs text-red-500">{erroresTexto.email[0]}</p>
                        )}
                    </div>

                    {/* Campo: Contraseña */}
                    <div>
                        <label className="mb-1 block text-sm font-medium text-slate-700">Contraseña</label>
                        <div className="relative">
                            <input
                                type={mostrarPass ? 'text' : 'password'}
                                value={form.password}
                                onChange={(e) => manejarInput('password', e.target.value)}
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

                        {/* Checklist de requisitos en tiempo real */}
                        <div className="mt-3 flex flex-col gap-1.5">
                            <span className={`text-xs flex items-center gap-1.5 transition-colors ${reglasPass.length ? 'text-green-600' : 'text-slate-500'}`}>
                                {reglasPass.length ? '✓' : '•'} Al menos 8 caracteres
                            </span>
                            <span className={`text-xs flex items-center gap-1.5 transition-colors ${reglasPass.upper ? 'text-green-600' : 'text-slate-500'}`}>
                                {reglasPass.upper ? '✓' : '•'} Una letra mayúscula
                            </span>
                            <span className={`text-xs flex items-center gap-1.5 transition-colors ${reglasPass.number ? 'text-green-600' : 'text-slate-500'}`}>
                                {reglasPass.number ? '✓' : '•'} Un número
                            </span>
                        </div>
                    </div>

                    {/* Botón Submit */}
                    <Button type="submit" variant="primary" fullWidth disabled={loading} className="mt-2 rounded-2xl px-4 py-3">
                        {loading ? "Creando cuenta..." : "Registrarse"}
                    </Button>

                    {mensajeError && (
                        <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                            {mensajeError}
                        </p>
                    )}
                </form>

                <div className="mt-6 text-center text-sm text-slate-600">
                    <span>¿Ya tenés cuenta? </span>
                    <Link href="/login" className="font-semibold text-slate-900 hover:underline">
                        Iniciar sesión
                    </Link>
                </div>
            </div>
        </div>
    );
}