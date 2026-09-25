"use client";

import type { Pregunta } from "../_types/faq";
import { useFaqAcordeon } from "../_hooks/useFaqAcordeon";
import { ListaFaq } from "./ListaFaq";

interface FaqPaginaProps {
  preguntas: Pregunta[];
}

export function FaqPagina({ preguntas }: FaqPaginaProps) {
  const { idAbierta, alternar } = useFaqAcordeon();

  return (
    <ListaFaq preguntas={preguntas} idAbierta={idAbierta} onAlternar={alternar} />
  );
}