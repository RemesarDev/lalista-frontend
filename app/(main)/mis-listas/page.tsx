// app/(main)/mis-listas/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useListaStore } from '@/app/_store/store';
import { useMisListas } from './_hooks/useMisListas';
import { useAbrirLista } from './_hooks/useAbrirLista';
import BaseContainer from '@/app/_components/global/BaseContainer';
import ConfirmModal from '../../_components/global/ConfirmModal';
import { CompartirListaModal } from './_components/CompartirListaModal';
import { CompartirContenidoListaModal } from './_components/CompartirContenidoListaModal';
import { ListIcon, LockIcon, TrashIcon, ShareNetworkIcon, UsersThreeIcon } from '@phosphor-icons/react';
import type { RolLista } from '@/app/_store/slices/listaSlice';

// Tipado para el estado del modal de eliminación
interface ModalEliminarState {
    isOpen: boolean;
    listaId: string | null;
    rol: string | null;
}

// Tipado para el estado del modal de compartir
interface ModalCompartirState {
    isOpen: boolean;
    listaId: string | null;
}

interface ModalCompartirContenidoState {
    isOpen: boolean;
    listaId: string | null;
    listaNombre: string;
}

export default function MisListasPage() {
    const router = useRouter();
    const user = useListaStore((state) => state.user);
    const loadingAuth = useListaStore((state) => state.loadingAuth);
    const checkAuth = useListaStore((state) => state.checkAuth);

    const { listas, cargando, error, eliminarLista } = useMisListas(user?.id ?? null);
    const { abrirLista, cargandoAbrir } = useAbrirLista();

    const [modalEliminar, setModalEliminar] = useState<ModalEliminarState>({ isOpen: false, listaId: null, rol: null });
    const [modalCompartir, setModalCompartir] = useState<ModalCompartirState>({ isOpen: false, listaId: null });
    const [modalCompartirContenido, setModalCompartirContenido] = useState<ModalCompartirContenidoState>({
        isOpen: false,
        listaId: null,
        listaNombre: '',
    });

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

    const handleSolicitarEliminacion = (id: string, rol: string) => {
        setModalEliminar({ isOpen: true, listaId: id, rol });
    };

    const handleConfirmarEliminacion = () => {
        if (modalEliminar.listaId) {
            eliminarLista(modalEliminar.listaId);
        }
    };

    const esPropietario = modalEliminar.rol === 'owner';
    const tituloModal = esPropietario ? '¿Borrar lista?' : '¿Abandonar lista?';
    const mensajeModal = esPropietario
        ? 'Esta acción eliminará la lista permanentemente para vos y todos los invitados. No se puede deshacer.'
        : 'Saldrás de esta lista compartida y ya no podrás ver sus actualizaciones.';

    return (
        <BaseContainer>
            {/* Modal eliminar/abandonar */}
            <ConfirmModal
                isOpen={modalEliminar.isOpen}
                onClose={() => setModalEliminar({ isOpen: false, listaId: null, rol: null })}
                onConfirm={handleConfirmarEliminacion}
                titulo={tituloModal}
                mensaje={mensajeModal}
                textoConfirmar={esPropietario ? 'Sí, borrar' : 'Sí, abandonar'}
                isDestructive={true}
            />

            {/* Modal compartir */}
            <CompartirListaModal
                isOpen={modalCompartir.isOpen}
                onClose={() => setModalCompartir({ isOpen: false, listaId: null })}
                listaId={modalCompartir.listaId}
            />

            <CompartirContenidoListaModal
                isOpen={modalCompartirContenido.isOpen}
                onClose={() => setModalCompartirContenido({ isOpen: false, listaId: null, listaNombre: '' })}
                listaId={modalCompartirContenido.listaId}
                listaNombre={modalCompartirContenido.listaNombre}
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
                            className="flex flex-col gap-3 rounded-2xl bg-white border border-slate-200 px-4 py-4 shadow-sm"
                        >
                            <div className="flex items-center justify-between gap-3">
                                <button
                                    onClick={() => abrirLista(lista.id, lista.rol as RolLista)}
                                    disabled={cargandoAbrir}
                                    className="flex min-w-0 flex-1 items-center gap-3 text-left transition-opacity hover:opacity-75 disabled:opacity-50"
                                >
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                                        <ListIcon size={20} weight="regular" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-semibold text-slate-900">{lista.nombre}</p>
                                        <p className="mt-0.5 text-xs text-slate-400">
                                            {lista.rol === 'owner' ? 'Tuya' : lista.rol === 'editor' ? 'Compartida · Editor' : 'Compartida · Lector'}
                                        </p>
                                    </div>
                                </button>

                                <div className="flex shrink-0 items-center gap-2">
                                    {lista.rol !== 'owner' && (
                                        <span title="No podés administrar los miembros de esta lista">
                                            <LockIcon size={16} className="text-slate-300" />
                                        </span>
                                    )}
                                    {lista.rol === 'owner' && (
                                        <button
                                            onClick={() => setModalCompartir({ isOpen: true, listaId: lista.id })}
                                            className="p-1 text-slate-400 transition-colors hover:text-slate-700"
                                            title="Administrar miembros"
                                            aria-label="Administrar miembros"
                                        >
                                            <UsersThreeIcon size={17} weight="bold" />
                                        </button>
                                    )}
                                    <button
                                        onClick={() => setModalCompartirContenido({ isOpen: true, listaId: lista.id, listaNombre: lista.nombre })}
                                        className="p-1 text-slate-400 transition-colors hover:text-slate-700"
                                        title="Compartir lista"
                                        aria-label="Compartir lista"
                                    >
                                        <ShareNetworkIcon size={17} weight="bold" />
                                    </button>
                                    <button
                                        onClick={() => handleSolicitarEliminacion(lista.id, lista.rol)}
                                        className="p-1 text-slate-400 transition-colors hover:text-red-500"
                                        title={lista.rol === 'owner' ? 'Borrar lista' : 'Salir de la lista'}
                                        aria-label={lista.rol === 'owner' ? 'Borrar lista' : 'Salir de la lista'}
                                    >
                                        <TrashIcon size={16} weight="regular" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </BaseContainer>
    );
}