import Image from 'next/image';
import type { Metadata } from 'next';
import FooterLanding from '@/app/_components/global/Footer-landing';

export const metadata: Metadata = {
  title: 'Lalista | Disponibilidad regional',
  description: 'Disponibilidad regional de Lalista.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function AccesoRestringidoPage() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-800">
      <header className="border-b border-purple-100 bg-primary-400 px-6 py-4">
        <div className="mx-auto max-w-7xl">
          <Image
            src="/img/lalista-logo.png"
            alt="Lalista"
            width={90}
            height={90}
            priority
            className="h-auto w-22"
          />
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center px-6 py-16 text-center">
        <div
          aria-hidden="true"
          className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-purple-100 text-3xl text-purple-700"
        >
          ⌖
        </div>

        <h1 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
          Lalista todavía no está disponible en tu región
        </h1>

        <p className="mb-3 max-w-xl text-base leading-7 text-slate-600">
          Actualmente, Lalista está disponible únicamente en Argentina.
        </p>
        <p className="max-w-xl text-sm leading-6 text-slate-500">
          ¿Estás en Argentina y ves este mensaje? Escribinos a{' '}
          <a className="text-purple-700 underline" href="mailto:lalista.notificaciones@gmail.com">
            lalista.notificaciones@gmail.com
          </a>
          .
        </p>
      </main>

      <FooterLanding />
    </div>
  );
}
