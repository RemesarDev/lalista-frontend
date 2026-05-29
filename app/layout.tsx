import type { Metadata } from "next";
import "./globals.css"; // Mantenemos los estilos globales en la raíz

export const metadata: Metadata = {
  title: "LALIsta - Tu compañera en las compras",
  description: "Comparador inteligente de precios de supermercados para Argentina.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="antialiased bg-slate-100 text-slate-900 font-sans">
        {/* Sin divs extras ni layouts pesados aquí, solo los hijos */}
        {children}
      </body>
    </html>
  );
}