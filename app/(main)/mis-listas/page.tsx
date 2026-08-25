// app/(main)/mis-listas/page.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useListaStore } from '@/app/_store/store';
import { useMisListas } from './_hooks/useMisListas';
import BaseContainer from '@/app/_components/global/BaseContainer';
import { ListIcon, LockIcon } from '@phosphor-icons/react';

export default function MisListasPage() {
    const router = useRouter();
    const user = useListaStore((state) => state.user);
    const loadingAuth = useListaStore((state) => state.loadingAuth);
    const checkAuth = useListaStore((state) => state.checkAuth);

    const { listas, cargando, error } = useMisListas(user?.id ?? null);

    // authentication check
    useEffect(() => {
        let mounted = true;
        const verifyAuth = async () => {
            const nextUser = await checkAuth();
            if (!mounted) return;
            if (!nextUser) router.replace('/login');
        };
        void verifyAuth();
        return () => { mounted = false; };
    }, [checkAuth, router]);

    if (loadingAuth) return (
        <p className="text-center text-sm text-slate-400 py-4">Cargando...</p>
    );

    if (!user) return null;

    return (
        <BaseContainer>
            {/* Encabezado */}
            <div className="mb-6 flex flex-row items-center justify-between gap-4 px-1 w-full border-b border-slate-50 pb-3">
                <div className="flex flex-col">
                    <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                        Mis listas
                    </h1>
                    <p className="text-[11px] sm:text-xs font-medium text-slate-400 mt-0.5">
                        Tus listas guardadas en la nube
                    </p>
                </div>
            </div>

            {/* Estados */}
            {cargando && (
                <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-400">
                    <span className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm">Cargando tus listas...</p>
                </div>
            )}

            {error && (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 text-center">
                    {error}
                </div>
            )}

            {!cargando && !error && listas.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 gap-2 text-center text-slate-400 px-4">
                    <span className="text-4xl">🛒</span>
                    <p className="text-sm font-medium">Todavía no guardaste ninguna lista.</p>
                    <p className="text-xs">Andá a <strong className="text-orange-500">Mi lista</strong> y guardala en la nube.</p>
                </div>
            )}

            {!cargando && !error && listas.length > 0 && (
                <div className="flex flex-col gap-3">
                    {listas.map((lista) => (
                        <div
                            key={lista.id}
                            className="flex items-center justify-between rounded-2xl bg-white border border-slate-200 px-4 py-4 shadow-sm"
                        >
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-500 shrink-0">
                                    <ListIcon size={20} weight="regular" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-slate-900">{lista.nombre}</p>
                                    <p className="text-xs text-slate-400 mt-0.5">
                                        {lista.rol === 'owner' ? 'Tuya' : lista.rol === 'editor' ? 'Compartida · Editor' : 'Compartida · Lector'}
                                    </p>
                                </div>
                            </div>

                            {lista.rol !== 'owner' && (
                                <LockIcon size={16} className="text-slate-300 shrink-0" />
                            )}
                        </div>
                    ))}
                </div>
            )}
        </BaseContainer>
    );
}