interface SearchHintsProps {
  searchTerm: string;
}

export default function SearchHints({ searchTerm }: SearchHintsProps) {
  const trimmed = searchTerm.trim();
  const charCount = trimmed.length;
  const wordCount = trimmed ? trimmed.split(/\s+/).length : 0;

  // Condiciones
  const needsMoreChars = charCount > 0 && charCount < 3;
  const needsMoreWords = wordCount ==1;

  if (!needsMoreChars && !needsMoreWords) return null;

  return (
    // pointer-events-none: es solo informativo y flota sobre los chips de
    // filtros, no tiene que robarles los toques.
    <div className="pointer-events-none absolute left-0 top-full mt-1.5 z-20 w-full px-1 text-xs transition-all">
      {needsMoreChars ? (
        /* Pop-up flotante con tono lila basado en tu --color-primary-400 */
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-primary-400/15 border border-primary-400/45 text-black rounded-md shadow-sm font-medium animate-fadeIn dark:bg-primary-400/20 dark:border-primary-400/40 dark:text-black">
          <span>⚠️</span>
          <span>Ingresá al menos 3 letras para iniciar la búsqueda.</span>
        </div>
      ) : (
        /* Mensaje suave debajo del input para menos de 2 palabras */
        needsMoreWords && (
          /* Con fondo propio: queda encima de los chips y sin fondo se mezclaba con ellos. */
          <p className="inline-block rounded-md bg-white/95 px-2 py-1 text-slate-400 shadow-sm dark:text-slate-500">
            💡 Para mejorar la búsqueda ingresá al menos dos palabras.
          </p>
        )
      )}
    </div>
  );
}