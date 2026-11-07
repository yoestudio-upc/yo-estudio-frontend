import { HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, delay, mergeMap, of, throwError, timer } from 'rxjs';
import { levelOf } from '../../domain/level-rules';
import { AnswerEvent } from '../../models/answer-event';
import { Goal, ResponseProfile, TakeProgress } from '../../models/dto/student.dto';
import { TagRef } from '../../models/dto/teacher.dto';
import { EvaluationStatus } from '../../models/evaluation';
import { Level } from '../../models/level';
import { SEED_TAGS } from './data/catalog';
import { MockEvaluation, seedEvaluations } from './data/evaluations';
import { PROFILES, practiceFor } from './data/recommendation';
import { MockResult, seedResults } from './data/results';
import { synthesize } from './data/synthetic';
import { SEED_CLASSES, SEED_STUDENTS, SEED_TEACHERS } from './data/school';
import { todayIso } from './mock-clock';
import { MOCK_LATENCY_MS } from './mock-latency';

// Cambiar la versión descarta los datos guardados con una forma anterior
const STORAGE_KEY = 'ye.mock.v1';

type MockClass = (typeof SEED_CLASSES)[number];

interface Snapshot {
  classes: MockClass[];
  evaluations: MockEvaluation[];
  results: MockResult[];
  progress: [string, TakeProgress][];
  events: [string, AnswerEvent][];
}

// Almacén compartido por todos los mocks: lo que crea el docente aparece luego para
// el estudiante. Se guarda en localStorage (sobrevive a recargas en este navegador).
@Injectable({ providedIn: 'root' })
export class MockDb {
  readonly tags = structuredClone(SEED_TAGS);
  readonly teachers = structuredClone(SEED_TEACHERS);
  readonly students = structuredClone(SEED_STUDENTS);
  readonly classes: MockClass[] = [];
  readonly evaluations: MockEvaluation[] = [];
  readonly results: MockResult[] = [];
  // "evaluación:alumno" → avance guardado
  readonly progress = new Map<string, TakeProgress>();
  // "evaluación:alumno:pregunta" → telemetría acumulada
  readonly events = new Map<string, AnswerEvent>();

  private seq = 0;

  constructor() {
    if (!this.restore()) this.seed();
  }

  // Guardar después de cada cambio
  save(): void {
    const snapshot: Snapshot = {
      classes: this.classes,
      evaluations: this.evaluations,
      results: this.results,
      progress: [...this.progress],
      events: [...this.events],
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
    } catch {
      // Sin almacenamiento: los datos viven solo mientras la página esté abierta
    }
  }

  // Vuelve a los datos de ejemplo (para empezar una sesión de prueba desde cero)
  reset(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // nada que borrar
    }
    this.seed();
  }

  private seed(): void {
    this.fill({
      classes: structuredClone(SEED_CLASSES),
      evaluations: seedEvaluations(),
      results: seedResults(),
      progress: [],
      events: [],
    });
    // El resto del salón también "rindió" sus evaluaciones (respuestas de ejemplo)
    const synthetic = synthesize(this.evaluations, this.results);
    this.results.push(...synthetic.results);
    synthetic.events.forEach(([key, event]) => this.events.set(key, event));
  }

  private restore(): boolean {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return false;
      this.fill(JSON.parse(raw) as Snapshot);
      return true;
    } catch {
      return false;
    }
  }

  private fill(s: Snapshot): void {
    this.classes.splice(0, this.classes.length, ...s.classes);
    this.evaluations.splice(0, this.evaluations.length, ...s.evaluations);
    this.results.splice(0, this.results.length, ...s.results);
    this.progress.clear();
    s.progress.forEach(([key, value]) => this.progress.set(key, value));
    this.events.clear();
    s.events.forEach(([key, value]) => this.events.set(key, value));
  }

  newId(prefix: string): string {
    return `${prefix}-${Date.now().toString(36)}-${++this.seq}`;
  }

  tagRef(id: string | null): TagRef | null {
    const tag = id ? this.tags.find((t) => t.id === id) : undefined;
    return tag ? { id: tag.id, code: tag.code, name: tag.name } : null;
  }

  tagRefs(ids: string[]): TagRef[] {
    return ids.flatMap((id) => this.tagRef(id) ?? []);
  }

  statusOf(evaluation: MockEvaluation, today = todayIso()): EvaluationStatus {
    if (!evaluation.published || !evaluation.startDate || !evaluation.endDate) return 'draft';
    if (evaluation.endDate < today) return 'closed';
    if (evaluation.startDate > today) return 'scheduled';
    return 'published';
  }

  resultOf(evaluationId: string, studentId: string): MockResult | undefined {
    return this.results.find((r) => r.evaluationId === evaluationId && r.studentId === studentId);
  }

  completedCount(evaluation: MockEvaluation): number {
    return new Set(
      this.results.filter((r) => r.evaluationId === evaluation.id).map((r) => r.studentId),
    ).size;
  }

  // Nivel por subtema con todas las respuestas del alumno en el curso (solo aciertos)
  levelsOf(studentId: string, classId: string): Map<string, Level> {
    return new Map(
      [...this.tallyOf(studentId, classId)].map(([id, t]) => [id, levelOf(t.correct, t.attempts)]),
    );
  }

  // Aciertos e intentos por subtema en el curso
  tallyOf(studentId: string, classId: string): Map<string, { correct: number; attempts: number }> {
    const tally = new Map<string, { correct: number; attempts: number }>();
    for (const result of this.results.filter((r) => r.studentId === studentId)) {
      const evaluation = this.evaluations.find((e) => e.id === result.evaluationId);
      if (!evaluation || evaluation.classId !== classId) continue;
      for (const question of evaluation.questions) {
        const chosen = result.answers[question.id] ?? null;
        const t = tally.get(question.subtopicId) ?? { correct: 0, attempts: 0 };
        t.attempts++;
        if (question.options.some((o) => o.id === chosen && o.correct)) t.correct++;
        tally.set(question.subtopicId, t);
      }
    }
    return tally;
  }

  // Recomendación simulada: subtemas no logrados de todos sus cursos, menor nivel primero
  goalsOf(studentId: string): Goal[] {
    const order = this.tags.map((t) => t.id);
    return this.classes
      .filter((c) => c.studentIds.includes(studentId))
      .flatMap((c) =>
        [...this.levelsOf(studentId, c.id)]
          .filter(([, level]) => level < 3)
          .map(([id, level]) => ({ classId: c.id, subject: c.subject, id, level })),
      )
      .sort((a, b) => a.level - b.level || order.indexOf(a.id) - order.indexOf(b.id))
      .map((g, i) => ({
        priority: i + 1,
        classId: g.classId,
        topic: this.tagRef(this.tags.find((t) => t.id === g.id)?.parentId ?? null)!,
        subtopic: this.tagRef(g.id)!,
        level: g.level,
        practice: practiceFor(g.subject, g.level),
      }));
  }

  // Perfil simulado a partir de la telemetría acumulada (el backend usa K-means)
  profileOf(studentId: string): ResponseProfile | null {
    const events = [...this.events].filter(([key]) => key.split(':')[1] === studentId);
    if (!events.length) {
      return this.results.some((r) => r.studentId === studentId) ? PROFILES.calm : null;
    }
    const n = events.length;
    const avgTime = events.reduce((s, [, e]) => s + e.timeMs, 0) / n;
    const changes = events.reduce((s, [, e]) => s + e.optionChanges, 0) / n;
    if (changes >= 1) return PROFILES.explorer;
    return avgTime < 8000 ? PROFILES.quick : PROFILES.calm;
  }
}

// Respuesta simulada con demora de red
export function respond<T>(value: T): Observable<T> {
  return of(structuredClone(value)).pipe(delay(MOCK_LATENCY_MS));
}

export function fail(status: number, body?: unknown): Observable<never> {
  return timer(MOCK_LATENCY_MS).pipe(
    mergeMap(() =>
      throwError(
        () => new HttpErrorResponse({ status, statusText: String(status), error: body ?? null }),
      ),
    ),
  );
}
