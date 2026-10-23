import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'LALIsta - Tu compañera en las compras',
  description:
    'Comparador inteligente de precios de supermercados para Argentina.',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'La Lista',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#C27BFF',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="antialiased bg-slate-100 text-slate-900 font-sans">
        {children}
      </body>
    </html>
  );
}
