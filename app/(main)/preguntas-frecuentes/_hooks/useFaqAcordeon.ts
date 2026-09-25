import { useState } from "react";

/**
 * Maneja el estado del acordeón: qué pregunta está abierta.
 * (La búsqueda se sacó; si en algún momento la vuelven a necesitar,
 * es cuestión de reintroducir el estado de `busqueda` acá adentro.)
 */
export function useFaqAcordeon() {
  const [idAbierta, setIdAbierta] = useState<string | null>(null);

  function alternar(id: string) {
    setIdAbierta((actual) => (actual === id ? null : id));
  }

  return { idAbierta, alternar };
}