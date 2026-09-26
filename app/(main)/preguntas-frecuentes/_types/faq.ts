export type CategoriaFaq =
  | "General"
  | "Los datos y los precios"
  | "Cómo usar LALIsta"
  | "Cobertura y próximos pasos"
  | "Tus datos y tu privacidad";

export interface Pregunta {
  /** Identificador único y estable (usado en la URL con anclas y en aria-ids) */
  id: string;
  pregunta: string;
  respuesta: string;
  categoria: CategoriaFaq;
}
