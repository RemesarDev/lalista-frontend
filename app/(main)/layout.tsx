import Header from "../_components/global/Header";
import StickySearch from "../_components/global/StickySearch";
import Navigation from "../_components/global/Navigation";
import FooterLanding from "../_components/global/Footer-landing";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
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

      {/* Footer visible solo en desktop */}
      <div className="hidden md:block">
        <FooterLanding />
      </div>
      
    </div>
  );
}