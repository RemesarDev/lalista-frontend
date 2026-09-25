import type { Pregunta } from "../_types/faq";
import { ItemFaq } from "./ItemFaq";

interface ListaFaqProps {
  preguntas: Pregunta[];
  idAbierta: string | null;
  onAlternar: (id: string) => void;
}

export function ListaFaq({ preguntas, idAbierta, onAlternar }: ListaFaqProps) {
  // Se preserva el orden de _data/preguntas.ts; solo se agrupa por categoría.
  const categorias = Array.from(new Set(preguntas.map((p) => p.categoria)));

  return (
    <div className="flex flex-col gap-8">
      {categorias.map((categoria) => (
        <section key={categoria} aria-labelledby={`titulo-${categoria}`}>
          <h2
            id={`titulo-${categoria}`}
            className="mb-3 text-base font-semibold text-neutral-800"
          >
            {categoria}
          </h2>
          <div className="divide-y divide-neutral-200 rounded-xl border border-neutral-200 bg-white">
            {preguntas
              .filter((p) => p.categoria === categoria)
              .map((pregunta) => (
                <ItemFaq
                  key={pregunta.id}
                  pregunta={pregunta}
                  abierta={idAbierta === pregunta.id}
                  onAlternar={() => onAlternar(pregunta.id)}
                />
              ))}
          </div>
        </section>
      ))}
    </div>
  );
}
