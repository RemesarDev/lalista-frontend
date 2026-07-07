import Navigation from "../_components/global/Navigation";
import HeaderUbicacion from "../_components/global/HeaderUbicacion";
import FooterLanding from "../_components/global/Footer-landing";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // bg-slate-50 unifica el fondo de toda la pantalla
    <div className="flex flex-col min-h-screen bg-slate-50/50">
      
      {/* Header fijo superior con el nuevo breakpoint lg */}
      <HeaderUbicacion />
      
      {/* Contenedor estructural: 
        - Eliminamos cualquier min-h forzado en mobile.
        - pb-24 asegura el espacio seguro sobre el Navigation flotante en mobile/tablet.
        - md:pb-6 normaliza el espacio en escritorio.
      */}
      <main className="w-full max-w-7xl mx-auto flex-initial pb-24 md:pb-6 px-4 sm:px-6">
        {children}
      </main>

      {/* Barra de navegación inferior fija para mobile/tablet */}
      <Navigation />

      {/* Footer exclusivo de escritorio */}
      <div className="hidden md:block">
        <FooterLanding />
      </div>
      
    </div>
  );
}