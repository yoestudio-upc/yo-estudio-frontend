import { AnswerEvent } from '../../../models/answer-event';
import { MockEvaluation } from './evaluations';
import { MockResult } from './results';

// Número estable en [0, 1) a partir de un texto: los datos de ejemplo son siempre iguales
export function hash01(key: string): number {
  let h = 2166136261;
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  // Mezcla final (fmix32 de murmur3): claves que solo difieren al final quedan bien repartidas
  h ^= h >>> 16;
  h = Math.imul(h, 0x85ebca6b);
  h ^= h >>> 13;
  h = Math.imul(h, 0xc2b2ae35);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

// Respuestas y telemetría de ejemplo para los alumnos que figuran como "ya la rindieron"
// (completedBy) y no tienen resultado guardado. Cada alumno tiene una habilidad fija.
export function synthesize(
  evaluations: MockEvaluation[],
  existing: MockResult[],
): { results: MockResult[]; events: [string, AnswerEvent][] } {
  const results: MockResult[] = [];
  const events: [string, AnswerEvent][] = [];
  for (const e of evaluations) {
    for (const studentId of e.completedBy) {
      if (existing.some((r) => r.evaluationId === e.id && r.studentId === studentId)) continue;
      const ability = 0.35 + 0.6 * hash01(studentId);
      const answers: Record<string, string | null> = {};
      for (const q of e.questions) {
        const key = `${studentId}:${q.id}`;
        const skipped = hash01(`${key}:skip`) < 0.06;
        const correct = q.options.find((o) => o.correct)!;
        const wrong = q.options.find((o) => !o.correct)!;
        answers[q.id] = skipped ? null : hash01(key) < ability ? correct.id : wrong.id;
        const changes = hash01(`${key}:changes`);
        events.push([
          `${e.id}:${studentId}:${q.id}`,
          {
            questionId: q.id,
            timeMs: Math.round(4000 + 40000 * hash01(`${key}:time`) * ability),
            optionChanges: changes < 0.2 ? 1 + Math.floor(changes * 10) : 0,
            skipped: skipped || hash01(`${key}:later`) < 0.08,
            revisits: skipped ? 1 : 0,
          },
        ]);
      }
      results.push({ evaluationId: e.id, studentId, answers, submittedAt: e.startDate ?? '' });
    }
  }
  return { results, events };
}
