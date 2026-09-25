import type { Metadata } from "next";
import { preguntas } from "./_data/preguntas";
import { FaqPagina } from "./_components/FaqPagina";

export const metadata: Metadata = {
  title: "Preguntas frecuentes | LALIsta",
  description:
    "Resolvé tus dudas sobre cómo funciona LALIsta: de dónde salen los precios, qué zonas cubrimos y cómo armar tu canasta para ahorrar en el super.",
};

// NOTA: no se usa <main> acá porque el layout de (main) ya envuelve la vista
// en un <main>. Duplicarlo rompe la semántica de landmarks de la página.
export default function PreguntasFrecuentesPage() {
  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8 sm:py-12">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold text-neutral-900 sm:text-3xl">
          Preguntas frecuentes
        </h1>
        <p className="mt-2 text-sm text-neutral-600 sm:text-base">
          Todo lo que necesitás saber sobre LALIsta antes de armar tu primera
          canasta.
        </p>
      </header>

      <FaqPagina preguntas={preguntas} />
    </div>
  );
}
