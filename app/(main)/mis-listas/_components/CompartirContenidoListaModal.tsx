'use client';

import { useEffect, useState } from 'react';
import {
    CopyIcon,
    ShareNetworkIcon,
    WhatsappLogoIcon,
    XIcon,
} from '@phosphor-icons/react';
import type { ItemLista } from '@/app/_types/listas';
import { generarTextoLista } from '@/app/_lib/utils/generarTextoLista';
import { Button } from '@/app/_components/global/Button';

interface CompartirContenidoListaModalProps {
    isOpen: boolean;
    onClose: () => void;
    listaId: string | null;
    listaNombre: string;
}

export function CompartirContenidoListaModal({
    isOpen,
    onClose,
    listaId,
    listaNombre,
}: CompartirContenidoListaModalProps) {
    const [items, setItems] = useState<ItemLista[]>([]);
    const [cargando, setCargando] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [copiado, setCopiado] = useState(false);

    useEffect(() => {
        if (!isOpen || !listaId) return;

        let mounted = true;
        setItems([]);
        setError(null);
        setCopiado(false);
        setCargando(true);

        fetch(`/api/listas/${listaId}/items`, { credentials: 'include' })
            .then(async (res) => {
                const json = await res.json();
                if (!res.ok) throw new Error(json.error ?? 'Error al cargar la lista');
                if (mounted) setItems(json.items ?? []);
            })
            .catch((err: Error) => {
                if (mounted) setError(err.message);
            })
            .finally(() => {
                if (mounted) setCargando(false);
            });

        return () => { mounted = false; };
    }, [isOpen, listaId]);

    if (!isOpen) return null;

    const textoLista = generarTextoLista(items);

    const compartirWhatsApp = () => {
        window.open(
            `https://wa.me/?text=${encodeURIComponent(textoLista)}`,
            '_blank',
            'noopener,noreferrer'
        );
    };

    const compartir = async () => {
        if (!items.length) return;

        if (!navigator.share) {
            compartirWhatsApp();
            return;
        }

        try {
            await navigator.share({
                title: listaNombre,
                text: textoLista,
            });
        } catch (err) {
            if (err instanceof Error && err.name !== 'AbortError') {
                setError('No se pudo compartir la lista');
            }
        }
    };

    const copiar = async () => {
        if (!items.length) return;

        try {
            await navigator.clipboard.writeText(textoLista);
            setCopiado(true);
            window.setTimeout(() => setCopiado(false), 1800);
        } catch {
            setError('No se pudo copiar la lista');
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 p-4 backdrop-blur-sm sm:items-center">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl" role="dialog" aria-modal="true">
                <div className="mb-4 flex items-start justify-between">
                    <div>
                        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                            <ShareNetworkIcon size={20} weight="regular" />
                        </div>
                        <h2 className="text-lg font-bold text-slate-900">Compartir lista</h2>
                        <p className="mt-1 text-sm text-slate-500">{listaNombre}</p>
                    </div>
                    <Button variant="ghost" onClick={onClose} aria-label="Cerrar">
                        <XIcon size={20} weight="bold" />
                    </Button>
                </div>

                {cargando && (
                    <p className="py-6 text-center text-sm text-slate-400">Cargando productos...</p>
                )}

                {error && (
                    <p className="mb-4 rounded-xl bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>
                )}

                {!cargando && !error && !items.length && (
                    <p className="py-6 text-center text-sm text-slate-400">La lista no tiene productos.</p>
                )}

                {!cargando && items.length > 0 && (
                    <pre className="max-h-64 overflow-auto whitespace-pre-wrap rounded-xl bg-slate-50 p-3 text-xs leading-5 text-slate-700">
                        {textoLista}
                    </pre>
                )}

                <div className="mt-5 flex flex-col gap-2">
                    <Button
                        variant="primary"
                        fullWidth
                        onClick={() => void compartir()}
                        disabled={cargando || !items.length}
                        className="gap-2 rounded-xl px-4 py-2.5"
                    >
                        <ShareNetworkIcon size={17} weight="bold" />
                        Compartir
                    </Button>
                    <Button
                        variant="success"
                        fullWidth
                        onClick={compartirWhatsApp}
                        disabled={cargando || !items.length}
                        className="gap-2 rounded-xl px-4 py-2.5"
                    >
                        <WhatsappLogoIcon size={17} weight="bold" />
                        WhatsApp
                    </Button>
                    <Button
                        variant="secondary"
                        fullWidth
                        onClick={() => void copiar()}
                        disabled={cargando || !items.length}
                        className="gap-2 rounded-xl px-4 py-2.5"
                    >
                        <CopyIcon size={17} weight="bold" />
                        {copiado ? 'Copiado' : 'Copiar texto'}
                    </Button>
                </div>
            </div>
        </div>
    );
}