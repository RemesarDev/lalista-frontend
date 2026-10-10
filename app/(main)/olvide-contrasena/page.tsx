'use client';

import { useState } from 'react';
import Link from 'next/link';
import { authClient } from '@/app/_lib/auth-client';
import { traducirErrorAuth } from '@/app/_lib/utils/traductorAuth';
import { Button } from '@/app/_components/global/Button';

export default function OlvideContrasenaPage() {
    const [email, setEmail] = useState('');
    const [enviando, setEnviando] = useState(false);
    const [enviado, setEnviado] = useState(false);
    const [mensajeError, setMensajeError] = useState('');

    const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
        e.preventDefault();
        setMensajeError('');

        if (!email) {
            setMensajeError('Ingresá tu email.');
            return;
        }

        setEnviando(true);
        // Better Auth responde igual exista o no la cuenta (para no revelar qué
        // emails están registrados), así que solo un error de red o de rate limit
        // llega acá como error.
        const { error } = await authClient.requestPasswordReset({
            email,
            redirectTo: '/restablecer-contrasena',
        });
        setEnviando(false);

        if (error) {
            setMensajeError(traducirErrorAuth(error));
            return;
        }
        setEnviado(true);
    };

    if (enviado) {
        return (
            <div className="flex min-h-[60vh] items-center justify-center px-4 py-10">
                <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-sm border border-slate-200 text-center">
                    <h1 className="text-2xl font-bold text-slate-900">Revisá tu correo</h1>
                    <p className="mt-3 text-sm text-slate-600">
                        Si hay una cuenta con <span className="font-semibold text-slate-900">{email}</span>, te mandamos un link para elegir una nueva contraseña. Vence en 1 hora.
                    </p>
                    <p className="mt-4 text-xs text-slate-500">
                        ¿No te llegó? Revisá también la carpeta de spam, o pedilo de nuevo en un minuto.
                    </p>
                    <div className="mt-6 text-sm">
                        <Link href="/login" className="font-semibold text-slate-900 hover:underline">
                            Volver a iniciar sesión
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-[60vh] items-center justify-center px-4 py-10">
            <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-sm border border-slate-200">
                <h1 className="text-2xl font-bold text-slate-900">Olvidé mi contraseña</h1>
                <p className="mt-2 text-sm text-slate-600 mb-6">
                    Ingresá el email de tu cuenta y te mandamos un link para elegir una nueva.
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => {
                                setEmail(e.target.value);
                                setMensajeError('');
                            }}
                            className={`w-full rounded-2xl border bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:bg-white ${mensajeError && !email ? 'border-red-500 focus:border-red-500' : 'border-slate-300 focus:border-slate-900'
                                }`}
                        />
                    </div>

                    <Button type="submit" variant="primary" fullWidth disabled={enviando} className="mt-2">
                        {enviando ? 'Enviando...' : 'Enviarme el link'}
                    </Button>

                    {mensajeError && (
                        <p className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 text-center">
                            {mensajeError}
                        </p>
                    )}
                </form>

                <div className="mt-6 flex items-center justify-center gap-2 text-sm text-slate-600">
                    <span>¿Te acordaste?</span>
                    <Link href="/login" className="font-semibold text-slate-900 hover:underline">
                        Iniciar sesión
                    </Link>
                </div>
            </div>
        </div>
    );
}
