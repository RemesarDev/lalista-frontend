import type { Metadata, Viewport } from "next";
import "./globals.css"; 


export const metadata: Metadata = {
  title: "LALIsta - Tu compañera en las compras",
  description: "Comparador inteligente de precios de supermercados para Argentina.",
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="antialiased bg-slate-100 text-slate-900 font-sans">
        {children}
      </body>
    </html>
  );
}