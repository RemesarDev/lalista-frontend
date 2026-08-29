// app/(main)/mis-listas/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useListaStore } from '@/app/_store/store';
import { useMisListas } from './_hooks/useMisListas';
import BaseContainer from '@/app/_components/global/BaseContainer';
import ConfirmModal from './_components/ConfirmModal';
import { ListIcon, LockIcon, TrashIcon } from '@phosphor-icons/react';

// Tipado para el estado del modal
interface ModalState {
    isOpen: boolean;
    listaId: string | null;
    rol: string | null;
}

export default function MisListasPage() {
    const router = useRouter();
    const user = useListaStore((state) => state.user);
    const loadingAuth = useListaStore((state) => state.loadingAuth);
    const checkAuth = useListaStore((state) => state.checkAuth);

    const { listas, cargando, error, eliminarLista } = useMisListas(user?.id ?? null);

    // Estado controlador del modal
    const [modal, setModal] = useState<ModalState>({ isOpen: false, listaId: null, rol: null });

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

    // Abre el modal guardando el contexto
    const handleSolicitarEliminacion = (id: string, rol: string) => {
        setModal({ isOpen: true, listaId: id, rol });
    };

    // Ejecuta la mutación y resetea el estado
    const handleConfirmarEliminacion = () => {
        if (modal.listaId) {
            eliminarLista(modal.listaId);
        }
    };

    // Computamos los textos del modal dinámicamente según el rol
    const esPropietario = modal.rol === 'owner';
    const tituloModal = esPropietario ? '¿Borrar lista?' : '¿Abandonar lista?';
    const mensajeModal = esPropietario
        ? 'Esta acción eliminará la lista permanentemente para vos y todos los invitados. No se puede deshacer.'
        : 'Saldrás de esta lista compartida y ya no podrás ver sus actualizaciones.';

    return (
        <BaseContainer>
            {/* INYECCIÓN DEL MODAL */}
            <ConfirmModal
                isOpen={modal.isOpen}
                onClose={() => setModal({ isOpen: false, listaId: null, rol: null })}
                onConfirm={handleConfirmarEliminacion}
                titulo={tituloModal}
                mensaje={mensajeModal}
                textoConfirmar={esPropietario ? 'Sí, borrar' : 'Sí, abandonar'}
                isDestructive={true}
            />

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

                            <div className="flex items-center gap-2 shrink-0">
                                {lista.rol !== 'owner' && (
                                    <LockIcon size={16} className="text-slate-300" />
                                )}
                                <button
                                    onClick={() => handleSolicitarEliminacion(lista.id, lista.rol)}
                                    className="text-slate-400 hover:text-red-500 transition-colors p-1"
                                    title={lista.rol === 'owner' ? 'Borrar lista' : 'Salir de la lista'}
                                >
                                    <TrashIcon size={16} weight="regular" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </BaseContainer>
    );
}