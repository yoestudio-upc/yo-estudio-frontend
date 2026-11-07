import { QuestionDraft } from '../models/dto/teacher.dto';
import { TakeProgress } from '../models/dto/student.dto';
import { QuestionType } from '../models/question';

// Opciones A–D: la pantalla del estudiante (04) las muestra en una grilla de 2 × 2
export const MIN_OPTIONS = 2;
export const MAX_OPTIONS = 4;
export const MAX_POINTS = 10;
export const MAX_ACCEPTED = 5;
export const OPTION_LETTERS = ['A', 'B', 'C', 'D'];
// Verdadero o falso: opciones fijas, en este orden (igual que el backend)
export const TRUE_FALSE_LABELS = ['Verdadero', 'Falso'];

// Reglas de D3, con los mismos mensajes que el backend. Vacío = la pregunta se puede guardar.
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

  const correct = draft.options.filter((o) => o.correct).length;
  if (draft.type === 'short') {
    const accepted = (draft.acceptedAnswers ?? []).filter((a) => a.trim());
    if (!accepted.length) problems.push('Escribe al menos una respuesta aceptada.');
    if (accepted.length > MAX_ACCEPTED) {
      problems.push(`Agrega como máximo ${MAX_ACCEPTED} respuestas aceptadas.`);
    }
    return problems;
  }
  if (draft.type === 'truefalse') {
    if (draft.options.length !== 2 || correct !== 1) {
      problems.push('Marca si la respuesta correcta es Verdadero o Falso.');
    }
    return problems;
  }

  if (draft.options.length < MIN_OPTIONS) {
    problems.push(`Agrega al menos ${MIN_OPTIONS} opciones.`);
  }
  if (draft.options.some((o) => !o.text.trim())) {
    problems.push('Escribe el texto de todas las opciones.');
  }
  if (draft.type === 'multiple') {
    if (correct < 1) problems.push('Marca al menos una opción correcta.');
  } else if (correct !== 1) {
    problems.push('Marca cuál es la opción correcta (solo una).');
  }
  return problems;
}

// Respuesta corta: se compara sin tildes, mayúsculas ni espacios ("3 / 4" = "3/4")
export function normalizeAnswer(text: string): string {
  return text.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().replace(/\s+/g, '');
}

interface GradableQuestion {
  id: string;
  type: QuestionType;
  // En respuesta corta, las respuestas aceptadas (todas correct = true)
  options: { id: string; text: string; correct: boolean }[];
}

// Cómo queda guardada la respuesta (igual que Answer.choice del backend):
// el id de la opción, los ids ordenados separados por coma, o el texto escrito
export function storedAnswer(q: Pick<GradableQuestion, 'id' | 'type'>, p: TakeProgress): string | null {
  if (q.type === 'multiple') {
    const ids = [...(p.choices?.[q.id] ?? [])].sort();
    return ids.length ? ids.join(',') : null;
  }
  if (q.type === 'short') return p.texts?.[q.id]?.trim() || null;
  return p.answers[q.id] ?? null;
}

// Opción múltiple: todo o nada (bien solo si marca exactamente las correctas)
export function isCorrectAnswer(q: GradableQuestion, stored: string | null): boolean {
  if (stored === null) return false;
  if (q.type === 'short') {
    return q.options.some((o) => normalizeAnswer(o.text) === normalizeAnswer(stored));
  }
  const correct = q.options.filter((o) => o.correct).map((o) => o.id);
  if (q.type === 'multiple') return stored === [...correct].sort().join(',');
  return correct.includes(stored);
}

export function isAnswered(q: Pick<GradableQuestion, 'id' | 'type'>, p: TakeProgress): boolean {
  return storedAnswer(q, p) !== null;
}
