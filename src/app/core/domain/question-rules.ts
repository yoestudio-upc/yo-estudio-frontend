import { QuestionDraft } from '../models/dto/teacher.dto';

// Opciones A–D: la pantalla del estudiante (04) las muestra en una grilla de 2 × 2
export const MIN_OPTIONS = 2;
export const MAX_OPTIONS = 4;
export const MAX_POINTS = 10;
export const OPTION_LETTERS = ['A', 'B', 'C', 'D'];

// Reglas de D3. Vacío = la pregunta se puede guardar.
export function questionProblems(draft: QuestionDraft, allowedSubtopicIds: string[]): string[] {
  const problems: string[] = [];
  if (!draft.subtopicId || !allowedSubtopicIds.includes(draft.subtopicId)) {
    problems.push('Elige el subtema que evalúa.');
  }
  if (!draft.text.trim()) problems.push('Escribe el contenido de la pregunta.');

  const points = draft.points;
  if (points === null || !Number.isInteger(points) || points < 1 || points > MAX_POINTS) {
    problems.push(`Los puntos deben ser un número entero del 1 al ${MAX_POINTS}.`);
  }

  if (draft.options.length < MIN_OPTIONS) {
    problems.push(`Agrega al menos ${MIN_OPTIONS} opciones.`);
  }
  if (draft.options.some((o) => !o.text.trim())) {
    problems.push('Escribe el texto de todas las opciones.');
  }
  const correct = draft.options.filter((o) => o.correct).length;
  if (correct !== 1) problems.push('Marca cuál es la opción correcta (solo una).');
  return problems;
}
