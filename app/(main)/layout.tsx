import { AuthProvider } from "../_components/global/AuthProvider";
import Navigation from "../_components/global/Navigation";
import FooterLanding from "../_components/global/Footer-landing";
import Header from "../_components/global/header/Header";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <div className="flex flex-col min-h-screen bg-slate-50/50">
        <Header />
        <main className="w-full max-w-7xl mx-auto flex-initial pb-24 md:pb-6 px-4 sm:px-6">
          {children}
        </main>
        <Navigation />
        <div className="hidden md:block">
          <FooterLanding />
        </div>
      </div>
    </AuthProvider>
  );
}