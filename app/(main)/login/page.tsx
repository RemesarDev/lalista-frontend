'use client'; // Necesario porque usamos hooks y zustand
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useListaStore } from '@/app/_store/store'; // Ajusta la ruta a tu store

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    // Extraemos las acciones y el loading del store
    const login = useListaStore((state) => state.loginConEmail);
    const loading = useListaStore((state) => state.loadingAuth);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const result = await login(email, password);

        if (result.success) {
            router.push('/'); // O a donde quieras redirigir al usuario
        } else {
            alert("Error al iniciar sesión: " + (result.error?.message || "Credenciales incorrectas"));
        }
    };

    return (
        <div className="min-h-[70vh] flex items-center justify-center px-4 py-10">
            <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-sm border border-slate-200">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-slate-900">Iniciar sesión</h1>
                    <p className="mt-2 text-sm text-slate-600">
                        Accedé a tu cuenta para guardar ubicación, comparar precios y usar tu lista.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-900 focus:bg-white"
                        />
                    </div>

                    <div>
                        <label className="mb-1 block text-sm font-medium text-slate-700">Contraseña</label>
                        <input
                            type="password"
                            required
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
                        {loading ? "Entrando..." : "Entrar"}
                    </button>
                </form>

                <div className="mt-6 flex items-center justify-between text-sm text-slate-600">
                    <span>¿No tenés cuenta?</span>
                    <Link href="/signup" className="font-semibold text-slate-900 hover:underline">
                        Crear cuenta
                    </Link>
                </div>
            </div>
        </div>
    );
}