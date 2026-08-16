'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useListaStore } from '@/app/_store/store';
import BaseContainer from '@/app/_components/global/BaseContainer';
import { UserIcon, EnvelopeIcon, TrashIcon, SignOutIcon } from '@phosphor-icons/react';

export default function PerfilPage() {
    const router = useRouter();
    const user = useListaStore((state) => state.user);
    const loadingAuth = useListaStore((state) => state.loadingAuth);
    const logout = useListaStore((state) => state.logout);
    const borrarCuenta = useListaStore((state) => state.borrarCuenta);
    const checkAuth = useListaStore((state) => state.checkAuth);

    useEffect(() => {
        let mounted = true;

        const verifyAuth = async () => {
            const nextUser = await checkAuth();

            if (!mounted) return;
            if (!nextUser) {
                router.replace('/login');
            }
        };

        void verifyAuth();

        return () => {
            mounted = false;
        };
    }, [checkAuth, router]);

    if (loadingAuth) return (
        <p className="text-center text-sm text-slate-400 py-4">Cargando...</p>
    );

    if (!user) return null;

    const handleLogout = async () => {
        await logout();
        router.replace('/');
    };

    const handleBorrarCuenta = async () => {
        const confirmar = window.confirm('¿Seguro que querés borrar tu cuenta? Esta acción no se puede deshacer.');
        if (!confirmar) return;

        const password = window.prompt('Ingresá tu contraseña actual para confirmar la eliminación:');
        if (!password || !password.trim()) {
            alert('La contraseña es obligatoria para borrar la cuenta.');
            return;
        }

        const result = await borrarCuenta(password);

        if (result.success) {
            alert('Tu cuenta fue eliminada correctamente.');
            router.replace('/');
            return;
        }

        const message = result.error?.message || 'No se pudo borrar la cuenta.';
        alert(message);
    };

    return (
        <BaseContainer>
            <div className="mb-6 border-b border-slate-50 pb-3">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Mi perfil</h1>
                <p className="text-[11px] sm:text-xs font-medium text-slate-400 mt-0.5">
                    Administrá tu cuenta
                </p>
            </div>

            <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-sm border border-slate-200 space-y-4">

                {/* Nombre */}
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-500 shrink-0">
                        <UserIcon size={20} weight="regular" />
                    </div>
                    <div>
                        <p className="text-xs text-slate-400 font-medium">Nombre</p>
                        <p className="text-sm font-semibold text-slate-900">{user.name}</p>
                    </div>
                </div>

                {/* Email */}
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-500 shrink-0">
                        <EnvelopeIcon size={20} weight="regular" />
                    </div>
                    <div>
                        <p className="text-xs text-slate-400 font-medium">Email</p>
                        <p className="text-sm font-semibold text-slate-900">{user.email}</p>
                    </div>
                </div>

                <div className="border-t border-slate-100 pt-4 flex flex-col gap-2">

                    {/* Cerrar sesión */}
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                        <SignOutIcon size={18} weight="bold" />
                        Cerrar sesión
                    </button>

                    {/* Borrar cuenta */}
                    <button
                        onClick={handleBorrarCuenta}
                        className="w-full flex items-center justify-center gap-2 rounded-2xl border border-red-200 px-4 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-50"
                    >
                        <TrashIcon size={18} weight="bold" />
                        Borrar cuenta
                    </button>

                </div>
            </div>
        </BaseContainer>
    );
}