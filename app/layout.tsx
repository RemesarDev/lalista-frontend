import type { Metadata, Viewport } from "next";
import { AnalyticsTracker } from '@/app/_components/global/AnalyticsTracker';
import { SerwistProvider } from "@serwist/turbopack/react";
import OfflineBanner from "./_components/OfflineBanner";
import { ContenedorAvisos } from "./_components/global/avisos/ContenedorAvisos";
import "./globals.css"; 
import { Suspense } from "react";


export const metadata: Metadata = {
  title: "LALIsta - Tu compañera en las compras",
  description: "Comparador inteligente de precios de supermercados para Argentina.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "La Lista",
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#C27BFF',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="antialiased bg-slate-100 text-slate-900 font-sans">
        <SerwistProvider swUrl="/serwist/sw.js">
          <OfflineBanner />
          <Suspense fallback={null}>
            <AnalyticsTracker />
          </Suspense>
          {children}
          {/* Avisos flotantes (toasts). En Suspense porque lee la URL. */}
          <Suspense fallback={null}>
            <ContenedorAvisos />
          </Suspense>
        </SerwistProvider>
      </body>
    </html>
  );
}