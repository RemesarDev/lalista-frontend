'use client';

// app/(main)/dev-ui/page.tsx
//
// Página de desarrollo — no es parte del producto, es para que el equipo
// compare opciones en vivo antes de fijar valores definitivos en Button.tsx
// y FilterPill.tsx. Mismo criterio que debug/page.tsx: no se enlaza desde
// ningún lado, se visita a mano en /dev-ui.

import { useState } from 'react';
import {
    FloppyDiskIcon,
    ShareNetworkIcon,
    TrashIcon,
    WhatsappLogoIcon,
    XIcon,
} from '@phosphor-icons/react';
import { Button, type ButtonVariant } from '@/app/_components/global/Button';
import { FilterPill } from '@/app/_components/global/FilterPill';

const SHAPE_OPTIONS = [
    { id: 'A', label: 'Opción A — compacto', shape: 'rounded-lg px-4 py-2' },
    { id: 'B', label: 'Opción B — actual de DesktopActionButton', shape: 'rounded-xl px-4 py-2.5' },
    { id: 'C', label: 'Opción C — el más usado hoy en pantallas', shape: 'rounded-2xl px-4 py-3' },
] as const;

const VARIANTS: { variant: ButtonVariant; label: string }[] = [
    { variant: 'primary', label: 'Primary' },
    { variant: 'secondary', label: 'Secondary' },
    { variant: 'destructive', label: 'Destructive' },
    { variant: 'success', label: 'Success' },
];

function Seccion({ numero, titulo, children }: { numero: string; titulo: string; children: React.ReactNode }) {
    return (
        <section className="mb-12">
            <h2 className="mb-1 text-base font-black text-slate-900">
                {numero}. {titulo}
            </h2>
            <div className="mt-4">{children}</div>
        </section>
    );
}

export default function DevUiPage() {
    const [pillActiva, setPillActiva] = useState<'a' | 'b'>('a');
    const [rolElegido, setRolElegido] = useState<'viewer' | 'editor'>('viewer');

    return (
        <div className="mx-auto max-w-3xl px-4 py-10">
            <h1 className="text-2xl font-black text-slate-900">Style guide — Button &amp; FilterPill</h1>
            <p className="mt-1 text-sm text-slate-500">
                Comparador en vivo, para elegir mirando en vez de a partir de un número. Todo lo de acá abajo son
                propuestas, no está fijado en ningún lado todavía.
            </p>

            {/* ============================================================ */}
            <Seccion numero="1" titulo="Radio y padding — elegí una opción para las 4 variantes sólidas">
                <div className="flex flex-col gap-8">
                    {SHAPE_OPTIONS.map((opcion) => (
                        <div key={opcion.id} className="rounded-2xl border border-slate-200 p-5">
                            <p className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-400">
                                {opcion.label} <span className="text-slate-300">({opcion.shape})</span>
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {VARIANTS.map((v) => (
                                    <Button key={v.variant} variant={v.variant} className={`gap-2 ${opcion.shape}`}>
                                        {v.variant === 'primary' && <FloppyDiskIcon size={16} weight="bold" />}
                                        {v.label}
                                    </Button>
                                ))}
                                <Button variant="ghost" className={opcion.shape}>
                                    <XIcon size={18} weight="bold" />
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            </Seccion>

            {/* ============================================================ */}
            <Seccion numero="2" titulo="FilterPill (referencia — ya no está en discusión, radio-full es unánime)">
                <div className="flex gap-2">
                    <FilterPill active={pillActiva === 'a'} onClick={() => setPillActiva('a')}>
                        Total
                    </FilterPill>
                    <FilterPill active={pillActiva === 'b'} onClick={() => setPillActiva('b')}>
                        Por producto
                    </FilterPill>
                </div>
            </Seccion>

            {/* ============================================================ */}
            <Seccion numero="3" titulo='¿"Muted" es variant nuevo? (3 apariciones ya en el código)'>
                <p className="mb-3 text-xs text-slate-400">
                    Usado hoy en CerrarListaModal, CompartirListaModal y ConfirmModal para "cancelar" cuando ya hay
                    otro botón primary al lado.
                </p>
                <div className="flex flex-wrap gap-2">
                    <button className="rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-200">
                        Cancelar (como está hoy)
                    </button>
                    <Button variant="secondary" className="rounded-xl px-4 py-2.5">
                        vs. Secondary existente
                    </Button>
                    <Button variant="ghost" fullWidth={false} className="rounded-xl px-4 py-2.5">
                        vs. Ghost existente
                    </Button>
                </div>
            </Seccion>

            {/* ============================================================ */}
            <Seccion numero="4" titulo='¿"Destructive-outline" es variant nuevo, o unificamos a Destructive sólido?'>
                <p className="mb-3 text-xs text-slate-400">
                    Hoy solo aparece en perfil/page.tsx ("Borrar cuenta"). Es la única instancia — capaz no
                    justifica un variant propio.
                </p>
                <div className="flex flex-wrap gap-2">
                    <button className="flex items-center gap-2 rounded-2xl border border-red-200 px-4 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-50">
                        <TrashIcon size={18} weight="bold" />
                        Borrar cuenta (como está hoy)
                    </button>
                    <Button variant="destructive" className="gap-2 rounded-2xl px-4 py-3">
                        <TrashIcon size={18} weight="bold" />
                        vs. Destructive sólido
                    </Button>
                </div>
            </Seccion>

            {/* ============================================================ */}
            <Seccion numero="5" titulo="Los dos rojos — hay que elegir uno">
                <div className="flex flex-wrap items-center gap-4">
                    <div className="text-center">
                        <button className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-700">
                            Sí, borrar mi cuenta
                        </button>
                        <p className="mt-1.5 text-[11px] text-slate-400">red-600 · ModalBorrarCuenta</p>
                    </div>
                    <div className="text-center">
                        <button className="rounded-xl bg-red-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-600">
                            Confirmar
                        </button>
                        <p className="mt-1.5 text-[11px] text-slate-400">red-500 · ConfirmModal</p>
                    </div>
                </div>
            </Seccion>

            {/* ============================================================ */}
            <Seccion numero="6" titulo="Toggle de 2 estados (selector de rol) — ¿se unifica con FilterPill?">
                <p className="mb-3 text-xs text-slate-400">
                    Mismo espíritu que FilterPill (alterna 2 estados) pero con rounded-xl en vez de rounded-full.
                    Hoy en CompartirListaModal.
                </p>
                <div className="flex gap-2">
                    <button
                        onClick={() => setRolElegido('viewer')}
                        className={`flex-1 rounded-xl border py-2 text-sm font-semibold transition-colors ${rolElegido === 'viewer'
                                ? 'border-slate-900 bg-slate-900 text-white'
                                : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                            }`}
                    >
                        Lector
                    </button>
                    <button
                        onClick={() => setRolElegido('editor')}
                        className={`flex-1 rounded-xl border py-2 text-sm font-semibold transition-colors ${rolElegido === 'editor'
                                ? 'border-slate-900 bg-slate-900 text-white'
                                : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                            }`}
                    >
                        Editor
                    </button>
                </div>
            </Seccion>

            {/* ============================================================ */}
            <Seccion numero="7" titulo='Familia "ícono que se pone rojo al hover" (papeleras/eliminar puntual)'>
                <p className="mb-3 text-xs text-slate-400">
                    Aparece en CompartirListaModal, ListItem y GrupoListItem. Gris en reposo, rojo al pasar el
                    mouse — distinto del ghost genérico (que va a slate-600, no a rojo).
                </p>
                <div className="flex gap-2">
                    <button className="rounded-lg p-1.5 text-slate-400 transition-colors hover:text-red-500">
                        <TrashIcon size={18} weight="bold" />
                    </button>
                    <button className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 transition hover:border-red-200 hover:text-red-500">
                        <XIcon size={16} weight="bold" />
                    </button>
                </div>
            </Seccion>

            <p className="mt-4 border-t border-slate-100 pt-6 text-xs text-slate-400">
                Cuando se decida cada punto, se mueven los valores definitivos a Button.tsx / FilterPill.tsx y esta
                página se puede borrar.
            </p>
        </div>
    );
}