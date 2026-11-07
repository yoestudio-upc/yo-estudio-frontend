import { EvaluationDraft, TagRef } from '../models/dto/teacher.dto';

// Qué se está intentando hacer con la evaluación
//  - draft: guardar borrador (basta el nombre)
//  - questions: crear preguntas (hace falta tema y subtemas)
//  - publish: publicar o guardar una ya publicada (tiene que estar completa)
export type EvaluationCheck = 'draft' | 'questions' | 'publish';

// Reglas de D2. Devuelve los problemas en lenguaje del docente; vacío = todo bien.
export function evaluationProblems(
  draft: EvaluationDraft,
  questions: { subtopicId: string }[],
  check: EvaluationCheck,
  subtopics: TagRef[],
  today: string,
): string[] {
  const problems: string[] = [];
  if (!draft.name.trim()) problems.push('Escribe el nombre de la evaluación.');
  if (check === 'draft') return problems;

  if (!draft.topicId) problems.push('Elige el tema.');
  if (!draft.subtopicIds.length) problems.push('Marca al menos un subtema.');
  if (check === 'questions') return problems;

  if (!draft.startDate || !draft.endDate) {
    problems.push('Elige la fecha de inicio y la de fin.');
  } else if (draft.endDate < draft.startDate) {
    problems.push('La fecha de fin debe ser igual o posterior a la de inicio.');
  } else if (draft.endDate < today) {
    problems.push('La fecha de fin ya pasó.');
  }

  if (!questions.length) {
    problems.push('Agrega al menos una pregunta.');
    return problems;
  }

  // Cada subtema marcado necesita al menos una pregunta para poder diagnosticarlo
  const name = (id: string) => subtopics.find((s) => s.id === id)?.name ?? 'un subtema';
  const covered = new Set(questions.map((q) => q.subtopicId));
  const missing = draft.subtopicIds.filter((id) => !covered.has(id));
  if (missing.length) {
    problems.push(`Falta al menos una pregunta de: ${missing.map(name).join(', ')}.`);
  }
  const orphan = questions.findIndex((q) => !draft.subtopicIds.includes(q.subtopicId));
  if (orphan >= 0) {
    problems.push(`La pregunta ${orphan + 1} evalúa un subtema que ya no está marcado.`);
  }
  return problems;
}
