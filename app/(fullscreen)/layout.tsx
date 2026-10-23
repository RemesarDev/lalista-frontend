import AppProviders from '@/app/_components/global/AppProviders';

export default function FullscreenLayout({ children }: { children: React.ReactNode }) {
  return (
  <AppProviders>
    // Fuerza el alto total de la pantalla del celular y previene scrolls molestos
    <main className="w-full h-screen overflow-hidden">
      {children}
    </main>
  </AppProviders>
);
}