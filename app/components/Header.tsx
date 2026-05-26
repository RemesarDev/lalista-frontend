import { List, MapPin, User } from "@phosphor-icons/react/dist/ssr";

export function Header() {
  return (
    <header className="sticky top-0 z-10 text-white py-3 px-4 shadow bg-primary-400">
      <div className="max-w-md mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button className="p-2 rounded bg-white/20 hover:bg-white/30 transition-colors">
            <List className="text-white text-xl" weight="regular" />
          </button>
          <h1 className="text-2xl font-bold font-display">Lali</h1>
        </div>
        
        <div className="flex items-center gap-2 text-sm">
          <MapPin className="text-white text-lg" weight="regular" />
          <div className="flex flex-col">
            <span className="text-xs opacity-75">Tu ubicación</span>
            <span className="font-semibold">Pendiente...</span>
          </div>
        </div>
        
        <button className="w-10 h-10 rounded-full border border-white/30 flex items-center justify-center flex-shrink-0 hover:bg-white/10 transition-colors">
          <User className="text-white" weight="regular" />
        </button>
      </div>
    </header>
  );
}
