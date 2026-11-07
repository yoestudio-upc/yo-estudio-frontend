// Tipos de pregunta (HU13). Respuesta corta: el docente define las respuestas aceptadas
// y se comparan sin tildes, mayúsculas ni espacios.
export type QuestionType = 'single' | 'truefalse' | 'multiple' | 'short';

export const QUESTION_TYPE_LABEL: Record<QuestionType, string> = {
  single: 'Elección única',
  truefalse: 'Verdadero o falso',
  multiple: 'Opción múltiple',
  short: 'Respuesta corta',
};

// Entidad Question: evalúa un solo subtema
export interface Question {
  id: string;
  evaluationId: string;
  type: QuestionType;
  text: string;
  points: number;
  subtopicId: string;
}
