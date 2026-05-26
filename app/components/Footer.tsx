import { InstagramLogo, FacebookLogo, YoutubeLogo } from "@phosphor-icons/react/dist/ssr";

export function Footer() {
  return (
    <footer className="text-white py-4 mt-auto bg-primary-400">
      <div className="max-w-md mx-auto text-center">
        <div className="flex items-center justify-center gap-6 mb-2">
          <a href="#" className="hover:opacity-80 transition-opacity" aria-label="Instagram">
            <InstagramLogo size={24} weight="regular" />
          </a>
          <a href="#" className="hover:opacity-80 transition-opacity" aria-label="Facebook">
            <FacebookLogo size={24} weight="regular" />
          </a>
          <a href="#" className="hover:opacity-80 transition-opacity" aria-label="Youtube">
            <YoutubeLogo size={24} weight="regular" />
          </a>
        </div>
        <div className="text-sm font-semibold">@LALista</div>
        <div className="text-xs opacity-90">Esto fue un plan de Mojojojo©</div>
      </div>
    </footer>
  );
}
