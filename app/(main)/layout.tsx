import { AuthProvider } from "../_components/global/AuthProvider";
import Navigation from "../_components/global/Navigation";
import FooterLanding from "../_components/global/Footer-landing";
import Header from "../_components/global/header/Header";
import { Suspense } from "react";
import { ModalProducto } from "../_components/global/ModalProducto";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <div className="flex flex-col min-h-screen bg-slate-50/50">
        <Header />
        <main className="w-full max-w-7xl mx-auto flex-initial pb-24 md:pb-6 px-4 sm:px-6">
          {children}
        </main>
        <Navigation />

        {/* Ficha de producto. Se monta una sola vez y se controla por la URL
            (?producto=EAN), asi cualquier vista puede abrirla. */}
        <Suspense fallback={null}>
          <ModalProducto />
        </Suspense>
        <div className="hidden md:block">
          <FooterLanding />
        </div>
      </div>
    </AuthProvider>
  );
}