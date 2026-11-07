// Entidad Answer: la opción que eligió el alumno (null = la dejó sin responder)
export interface Answer {
  questionId: string;
  optionId: string | null;
}
