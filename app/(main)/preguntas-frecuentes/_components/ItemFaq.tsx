import type { Pregunta } from "../_types/faq";

interface ItemFaqProps {
  pregunta: Pregunta;
  abierta: boolean;
  onAlternar: () => void;
}

export function ItemFaq({ pregunta, abierta, onAlternar }: ItemFaqProps) {
  const idBoton = `pregunta-${pregunta.id}`;
  const idPanel = `respuesta-${pregunta.id}`;

  return (
    <div>
      <h3>
        <button
          id={idBoton}
          type="button"
          onClick={onAlternar}
          aria-expanded={abierta}
          aria-controls={idPanel}
          className="flex w-full items-center justify-between gap-4 px-4 py-4 text-left text-sm font-medium text-neutral-900 sm:text-base"
        >
          <span>{pregunta.pregunta}</span>
          <span
            aria-hidden="true"
            className={`shrink-0 text-lg leading-none text-neutral-400 transition-transform duration-150 ${
              abierta ? "rotate-45" : ""
            }`}
          >
            +
          </span>
        </button>
      </h3>
      {abierta && (
        <div
          id={idPanel}
          role="region"
          aria-labelledby={idBoton}
          className="px-4 pb-4 text-sm leading-relaxed text-neutral-600"
        >
          {pregunta.respuesta}
        </div>
      )}
    </div>
  );
}
