// Por ahora solo elección única (HU13 Tipos de evaluación)
export type QuestionType = 'single';

// Entidad Question: evalúa un solo subtema
export interface Question {
  id: string;
  evaluationId: string;
  type: QuestionType;
  text: string;
  points: number;
  subtopicId: string;
}
