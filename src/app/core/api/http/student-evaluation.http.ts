import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import {
  EvaluationResult,
  TakeEvaluation,
  TakeProgress,
  TelemetryBatch,
} from '../../models/dto/student.dto';
import { Level } from '../../models/level';
import { API_URL } from '../api-url';
import { StudentEvaluationApi } from '../student-evaluation.api';
import { BackendTopicRef, toTagRefs } from './course-dto';

// Formas del backend: mismos campos que los DTO, con ids numéricos
interface BackendProgress {
  answers: Record<string, number>;
  skipped: number[];
  currentIndex: number;
}

interface BackendTakeEvaluation {
  id: number;
  classId: number;
  name: string;
  endDate: string | null;
  readingTitle: string | null;
  readingText: string | null;
  topic: BackendTopicRef;
  subtopics: BackendTopicRef[];
  questions: {
    id: number;
    subtopicId: number | null;
    text: string;
    options: { id: number; text: string }[];
  }[];
  progress: BackendProgress | null;
}

interface BackendResult {
  evaluationId: number;
  classId: number;
  name: string;
  topic: BackendTopicRef;
  totalCount: number;
  answeredCount: number;
  correctCount: number;
  subtopics: (BackendTopicRef & { level: Level })[];
}

@Injectable()
export class StudentEvaluationHttpApi extends StudentEvaluationApi {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(API_URL);

  private url(evaluationId: string): string {
    return `${this.apiUrl}/students/me/evaluations/${evaluationId}`;
  }

  getForTaking(evaluationId: string): Observable<TakeEvaluation> {
    return this.http.get<BackendTakeEvaluation>(this.url(evaluationId)).pipe(
      map((e) => ({
        id: String(e.id),
        classId: String(e.classId),
        name: e.name,
        endDate: e.endDate,
        readingTitle: e.readingTitle,
        readingText: e.readingText,
        topic: toTagRefs([e.topic])[0],
        subtopics: toTagRefs(e.subtopics),
        questions: e.questions.map((q) => ({
          id: String(q.id),
          subtopicId: q.subtopicId === null ? '' : String(q.subtopicId),
          text: q.text,
          options: q.options.map((o) => ({ id: String(o.id), text: o.text })),
        })),
        progress: e.progress ? fromBackendProgress(e.progress) : null,
      })),
    );
  }

  saveProgress(evaluationId: string, progress: TakeProgress): Observable<void> {
    return this.http.put<void>(`${this.url(evaluationId)}/progress`, toBackendProgress(progress));
  }

  sendTelemetry(evaluationId: string, events: TelemetryBatch): Observable<void> {
    return this.http.post<void>(
      `${this.url(evaluationId)}/telemetry`,
      events.map((e) => ({ ...e, questionId: Number(e.questionId) })),
    );
  }

  submit(evaluationId: string, progress: TakeProgress): Observable<EvaluationResult> {
    return this.http
      .post<BackendResult>(`${this.url(evaluationId)}/submit`, toBackendProgress(progress))
      .pipe(map(toResult));
  }

  getResult(evaluationId: string): Observable<EvaluationResult> {
    return this.http.get<BackendResult>(`${this.url(evaluationId)}/result`).pipe(map(toResult));
  }
}

function toBackendProgress(p: TakeProgress): BackendProgress {
  return {
    answers: Object.fromEntries(Object.entries(p.answers).map(([q, o]) => [q, Number(o)])),
    skipped: p.skipped.map(Number),
    currentIndex: p.currentIndex,
  };
}

function fromBackendProgress(p: BackendProgress): TakeProgress {
  return {
    answers: Object.fromEntries(Object.entries(p.answers).map(([q, o]) => [q, String(o)])),
    skipped: p.skipped.map(String),
    currentIndex: p.currentIndex,
  };
}

function toResult(r: BackendResult): EvaluationResult {
  return {
    evaluationId: String(r.evaluationId),
    classId: String(r.classId),
    name: r.name,
    topic: toTagRefs([r.topic])[0],
    totalCount: r.totalCount,
    answeredCount: r.answeredCount,
    correctCount: r.correctCount,
    subtopics: r.subtopics.map((s) => ({ ...toTagRefs([s])[0], level: s.level })),
  };
}
