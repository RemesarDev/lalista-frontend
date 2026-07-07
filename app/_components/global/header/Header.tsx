import HeaderLocation from "./HeaderLocation";
import HeaderLogo from "./HeaderLogo";
import HeaderNavUser from "./HeaderNavUser";

export default function Header() {
  return (
    <header className="w-full bg-primary-400 border-b border-accent-300 px-4 py-3 sticky top-0 z-50">
      {/* Usamos flex-col para móvil y cambiamos a row en md */}
      <div className="flex flex-col gap-3 max-w-7xl mx-auto w-full">
        
        {/* Fila 1: Siempre visible, optimizada */}
        <div className="flex items-center justify-between w-full">
          <HeaderLogo />
          <HeaderNavUser />
        </div>

    {/* Fila 2: Apéndice de ubicación */}
        <div className="w-full pb-0 px-0 md:hidden"> {/* Menos padding para que esté más pegado */}
          <HeaderLocation />
        </div>
      </div>
    </header>
  );
}