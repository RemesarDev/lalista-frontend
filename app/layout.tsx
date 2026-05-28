import type { Metadata } from "next";
import "./globals.css"; // Trae tu configuración de Tailwind v4 y variables de tema
import Header from "./_components/global/Header";
import StickySearch from "./_components/global/StickySearch";
import Navigation from "./_components/global/Navigation";

export const metadata: Metadata = {
  title: "LALIsta - Optimizá tus Compras",
  description: "Comparador inteligente de precios de supermercados para Zona Oeste.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="antialiased bg-slate-100 text-slate-900 font-sans">
        <div className="flex flex-col min-h-screen">
          
          {/* Header fijo superior (Logo + Selector de Ubicación + Login) */}
          <Header locationName="Ituzaingó" /> 
          
          {/* Buscador intermedio que se queda pegado arriba al hacer scroll */}
          <StickySearch />
          
          {/* El contenido dinámico de la página cae acá */}
          {/* max-w-md limita el ancho en mobile para simular una app nativa */}
          <main className="flex-grow w-full max-w-md mx-auto px-4 pt-2 pb-24 md:max-w-screen-xl">
            {children}
          </main>
          
          {/* Barra de navegación inferior (Fija en mobile, oculta en desktop) */}
          <Navigation />
          
        </div>
      </body>
    </html>
  );
}