"use client";

import { useEffect, useState } from "react";

const CLAVE = "lalista:ultima-conexion";

const guardarAhora = () => {
  try {
    localStorage.setItem(CLAVE, String(Date.now()));
  } catch {}
};

const leerUltima = (): number | null => {
  try {
    const v = localStorage.getItem(CLAVE);
    return v ? Number(v) : null;
  } catch {
    return null;
  }
};

const formatear = (ts: number) =>
  new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(ts);

export default function OfflineBanner() {
  const [offline, setOffline] = useState(false);
  const [ultima, setUltima] = useState<number | null>(null);

  useEffect(() => {
  const alConectar = () => {
    guardarAhora();
    setUltima(Date.now());
    setOffline(false);
  };

  const alDesconectar = () => {
    setUltima(leerUltima());
    setOffline(true);
  };

  const inicializar = () => {
    if (navigator.onLine) {
      guardarAhora();
      return;
    }

    setUltima(leerUltima());
    setOffline(true);
  };

  const id = window.setTimeout(inicializar, 0);

  window.addEventListener("online", alConectar);
  window.addEventListener("offline", alDesconectar);

  return () => {
    window.clearTimeout(id);
    window.removeEventListener("online", alConectar);
    window.removeEventListener("offline", alDesconectar);
  };
}, []);

  if (!offline) return null;

  return (
    <div className="sticky top-0 z-50 bg-amber-100 px-4 py-2 text-center text-sm text-amber-900">
      Estás sin conexión. Podés ver tu lista y los precios guardados, pero
      pueden estar desactualizados
      {ultima ? ` (última conexión: ${formatear(ultima)})` : ""}. No podés
      iniciar sesión hasta volver a conectarte.
    </div>
  );
}