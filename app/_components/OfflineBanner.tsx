"use client";

import { useEffect, useState } from "react";

export default function OfflineBanner() {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const actualizar = () => setOffline(!navigator.onLine);

    actualizar();
    window.addEventListener("online", actualizar);
    window.addEventListener("offline", actualizar);

    return () => {
      window.removeEventListener("online", actualizar);
      window.removeEventListener("offline", actualizar);
    };
  }, []);

  if (!offline) return null;

  return (
    <div className="sticky top-0 z-50 bg-amber-100 px-4 py-2 text-center text-sm text-amber-900">
      Estás sin conexión. Podés ver tu lista y los precios guardados, pero no se
      actualizan ni podés iniciar sesión.
    </div>
  );
}