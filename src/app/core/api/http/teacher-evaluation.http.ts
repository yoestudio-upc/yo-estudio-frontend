import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import {
  EvaluationDraft,
  QuestionDraft,
  TeacherEvaluationDetail,
  TeacherEvaluationSummary,
  TeacherQuestion,
} from '../../models/dto/teacher.dto';
import { Evaluation } from '../../models/evaluation';
import { API_URL } from '../api-url';
import { TeacherEvaluationApi } from '../teacher-evaluation.api';
import { BackendTopicRef, toTagRefs } from './course-dto';

// Formas del backend: mismos nombres de campos que los DTO, pero ids numéricos
type BackendEvaluation = Omit<Evaluation, 'id' | 'classId'> & {
  id: number;
  classId: number;
  topic: BackendTopicRef | null;
};

interface BackendEvaluationSummary extends BackendEvaluation {
  questionCount: number;
  completedCount: number;
  studentCount: number;
}

interface BackendQuestion {
  id: number;
  type: TeacherQuestion['type'];
  text: string;
  points: number;
  subtopicId: number | null;
  options: { id: number; text: string; correct: boolean }[];
  acceptedAnswers: string[];
}

interface BackendEvaluationDetail extends BackendEvaluation {
  subtopics: BackendTopicRef[];
  questions: BackendQuestion[];
}

@Injectable()
export class TeacherEvaluationHttpApi extends TeacherEvaluationApi {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(API_URL);

  private url(evaluationId: string): string {
    return `${this.apiUrl}/teachers/me/evaluations/${evaluationId}`;
  }

  private courseUrl(classId: string): string {
    return `${this.apiUrl}/teachers/me/courses/${classId}/evaluations`;
  }

  listByClass(classId: string): Observable<TeacherEvaluationSummary[]> {
    return this.http.get<BackendEvaluationSummary[]>(this.courseUrl(classId)).pipe(
      map((list) =>
        list.map((e) => ({
          ...toEvaluation(e),
          questionCount: e.questionCount,
          completedCount: e.completedCount,
          studentCount: e.studentCount,
        })),
      ),
    );
  }

  get(evaluationId: string): Observable<TeacherEvaluationDetail> {
    return this.http.get<BackendEvaluationDetail>(this.url(evaluationId)).pipe(map(toDetail));
  }

  create(classId: string, draft: EvaluationDraft): Observable<TeacherEvaluationDetail> {
    return this.http
      .post<BackendEvaluationDetail>(this.courseUrl(classId), toBackendDraft(draft))
      .pipe(map(toDetail));
  }

  update(evaluationId: string, draft: EvaluationDraft): Observable<TeacherEvaluationDetail> {
    return this.http
      .put<BackendEvaluationDetail>(this.url(evaluationId), toBackendDraft(draft))
      .pipe(map(toDetail));
  }

  publish(evaluationId: string): Observable<TeacherEvaluationDetail> {
    return this.http
      .post<BackendEvaluationDetail>(`${this.url(evaluationId)}/publish`, {})
      .pipe(map(toDetail));
  }

  addQuestion(evaluationId: string, draft: QuestionDraft): Observable<TeacherQuestion> {
    return this.http
      .post<BackendQuestion>(`${this.url(evaluationId)}/questions`, toBackendQuestion(draft))
      .pipe(map(toQuestion));
  }

  updateQuestion(
    evaluationId: string,
    questionId: string,
    draft: QuestionDraft,
  ): Observable<TeacherQuestion> {
    return this.http
      .put<BackendQuestion>(
        `${this.url(evaluationId)}/questions/${questionId}`,
        toBackendQuestion(draft),
      )
      .pipe(map(toQuestion));
  }

  deleteQuestion(evaluationId: string, questionId: string): Observable<void> {
    return this.http.delete<void>(`${this.url(evaluationId)}/questions/${questionId}`);
  }
}

function toNumberOrNull(id: string | null): number | null {
  return id ? Number(id) : null;
}

function toBackendDraft(draft: EvaluationDraft) {
  return {
    ...draft,
    topicId: toNumberOrNull(draft.topicId),
    subtopicIds: draft.subtopicIds.map(Number),
  };
}

function toBackendQuestion(draft: QuestionDraft) {
  return { ...draft, subtopicId: toNumberOrNull(draft.subtopicId) };
}

function toEvaluation(e: BackendEvaluation) {
  return {
    id: String(e.id),
    classId: String(e.classId),
    name: e.name,
    startDate: e.startDate,
    endDate: e.endDate,
    status: e.status,
    readingTitle: e.readingTitle,
    readingText: e.readingText,
    topic: e.topic ? toTagRefs([e.topic])[0] : null,
  };
}

function toDetail(e: BackendEvaluationDetail): TeacherEvaluationDetail {
  return {
    ...toEvaluation(e),
    subtopics: toTagRefs(e.subtopics),
    questions: e.questions.map(toQuestion),
  };
}

function toQuestion(q: BackendQuestion): TeacherQuestion {
  return {
    id: String(q.id),
    type: q.type,
    text: q.text,
    points: q.points,
    // El backend siempre guarda el subtema; '' solo si faltara
    subtopicId: q.subtopicId === null ? '' : String(q.subtopicId),
    options: q.options.map((o) => ({ id: String(o.id), text: o.text, correct: o.correct })),
    acceptedAnswers: q.acceptedAnswers ?? [],
  };
}
