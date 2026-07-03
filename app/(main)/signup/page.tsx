'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useListaStore } from '@/app/_store/store';

export default function SignupPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [name, setName] = useState("");

    // Accedemos a la acción de registro y al estado de carga desde el store
    const registro = useListaStore((state) => state.registroConEmail);
    const loading = useListaStore((state) => state.loadingAuth);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const result = await registro(email, password, name);

        if (result.success) {
            router.push('/login');
        } else {
            alert("Error al registrar cuenta: " + (result.error?.message || "Ocurrió un problema"));
        }
    };

    return (
        <div className="flex min-h-[60vh] items-center justify-center px-4 py-10">
            <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-sm border border-slate-200">
                <h1 className="text-2xl font-bold text-slate-900">Crear cuenta</h1>
                <p className="mt-2 text-sm text-slate-600 mb-6">
                    Completá tus datos para empezar a ahorrar.
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="mb-1 block text-sm font-medium text-slate-700">Nombre</label>
                        <input
                            required
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-900 focus:bg-white"
                        />
                    </div>
                    <div>
                        <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
                        <input
                            required
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-900 focus:bg-white"
                        />
                    </div>
                    <div>
                        <label className="mb-1 block text-sm font-medium text-slate-700">Contraseña</label>
                        <input
                            required
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-900 focus:bg-white"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
                    >
                        {loading ? "Creando cuenta..." : "Registrarse"}
                    </button>
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