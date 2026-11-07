import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthService } from '../../auth/auth.service';
import {
  EvaluationResult,
  TakeEvaluation,
  TakeProgress,
  TelemetryBatch,
} from '../../models/dto/student.dto';
import { isCorrectAnswer, storedAnswer } from '../../domain/question-rules';
import { StudentEvaluationApi } from '../student-evaluation.api';
import { MockEvaluation } from './data/evaluations';
import { MockDb, fail, respond } from './mock-db';

// 404 = no existe o no es de sus cursos · 409 = ya la rindió o no está abierta
@Injectable()
export class StudentEvaluationMockApi extends StudentEvaluationApi {
  private readonly db = inject(MockDb);
  private readonly auth = inject(AuthService);

  getForTaking(evaluationId: string): Observable<TakeEvaluation> {
    const check = this.openFor(evaluationId);
    if (typeof check === 'number') return fail(check);
    const e = check;
    return respond({
      id: e.id,
      classId: e.classId,
      name: e.name,
      endDate: e.endDate,
      readingTitle: e.readingTitle,
      readingText: e.readingText,
      topic: this.db.tagRef(e.topicId)!,
      subtopics: this.db.tagRefs(e.subtopicIds),
      // Sin respuesta correcta ni puntos
      questions: e.questions.map((q) => ({
        id: q.id,
        type: q.type,
        subtopicId: q.subtopicId,
        text: q.text,
        // Respuesta corta: las aceptadas nunca llegan al alumno
        options: q.type === 'short' ? [] : q.options.map((o) => ({ id: o.id, text: o.text })),
      })),
      progress: this.db.progress.get(this.key(e.id)) ?? null,
    });
  }

  saveProgress(evaluationId: string, progress: TakeProgress): Observable<void> {
    const check = this.openFor(evaluationId);
    if (typeof check === 'number') return fail(check);
    this.db.progress.set(this.key(evaluationId), structuredClone(progress));
    this.db.save();
    return respond(undefined);
  }

  sendTelemetry(evaluationId: string, events: TelemetryBatch): Observable<void> {
    // Cada lote trae incrementos: se suman a lo ya recibido
    for (const event of events) {
      const key = `${this.key(evaluationId)}:${event.questionId}`;
      const prev = this.db.events.get(key);
      this.db.events.set(key, {
        questionId: event.questionId,
        timeMs: (prev?.timeMs ?? 0) + event.timeMs,
        optionChanges: (prev?.optionChanges ?? 0) + event.optionChanges,
        skipped: (prev?.skipped ?? false) || event.skipped,
        revisits: (prev?.revisits ?? 0) + event.revisits,
      });
    }
    this.db.save();
    return respond(undefined);
  }

  submit(evaluationId: string, progress: TakeProgress): Observable<EvaluationResult> {
    const check = this.openFor(evaluationId);
    if (typeof check === 'number') return fail(check);
    const e = check;
    this.db.results.push({
      evaluationId,
      studentId: this.me(),
      answers: Object.fromEntries(e.questions.map((q) => [q.id, storedAnswer(q, progress)])),
      submittedAt: new Date().toISOString(),
    });
    this.db.progress.delete(this.key(evaluationId));
    this.db.save();
    return respond(this.toResult(e));
  }

  getResult(evaluationId: string): Observable<EvaluationResult> {
    const e = this.db.evaluations.find((ev) => ev.id === evaluationId);
    if (!e || !this.db.resultOf(evaluationId, this.me())) return fail(404);
    return respond(this.toResult(e));
  }

  private me(): string {
    return this.auth.user()?.id ?? '';
  }

  private key(evaluationId: string): string {
    return `${evaluationId}:${this.me()}`;
  }

  // La evaluación debe ser de un curso del alumno, estar abierta y no rendida
  private openFor(evaluationId: string): MockEvaluation | number {
    const e = this.db.evaluations.find((ev) => ev.id === evaluationId);
    const enrolled = this.db.classes.some(
      (c) => c.id === e?.classId && c.studentIds.includes(this.me()),
    );
    if (!e || !enrolled) return 404;
    if (this.db.statusOf(e) !== 'published' || this.db.resultOf(e.id, this.me())) return 409;
    return e;
  }

  private toResult(e: MockEvaluation): EvaluationResult {
    const result = this.db.resultOf(e.id, this.me())!;
    const levels = this.db.levelsOf(this.me(), e.classId);
    const answered = Object.values(result.answers).filter((a) => a !== null).length;
    const correct = e.questions.filter((q) => isCorrectAnswer(q, result.answers[q.id] ?? null)).length;
    return {
      evaluationId: e.id,
      classId: e.classId,
      name: e.name,
      topic: this.db.tagRef(e.topicId)!,
      totalCount: e.questions.length,
      answeredCount: answered,
      correctCount: correct,
      subtopics: this.db
        .tagRefs(e.subtopicIds)
        .map((s) => ({ ...s, level: levels.get(s.id) ?? 1 })),
    };
  }
}
