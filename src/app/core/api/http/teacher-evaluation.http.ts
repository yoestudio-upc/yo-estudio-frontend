import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import {
  EvaluationDraft,
  QuestionDraft,
  TeacherEvaluationDetail,
  TeacherEvaluationSummary,
  TeacherQuestion,
} from '../../models/dto/teacher.dto';
import { API_URL } from '../api-url';
import { TeacherEvaluationApi } from '../teacher-evaluation.api';

@Injectable()
export class TeacherEvaluationHttpApi extends TeacherEvaluationApi {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(API_URL);

  private url(evaluationId: string): string {
    return `${this.apiUrl}/teacher/evaluations/${evaluationId}`;
  }

  listByClass(classId: string): Observable<TeacherEvaluationSummary[]> {
    return this.http.get<TeacherEvaluationSummary[]>(
      `${this.apiUrl}/teacher/courses/${classId}/evaluations`,
    );
  }

  get(evaluationId: string): Observable<TeacherEvaluationDetail> {
    return this.http.get<TeacherEvaluationDetail>(this.url(evaluationId));
  }

  create(classId: string, draft: EvaluationDraft): Observable<TeacherEvaluationDetail> {
    return this.http.post<TeacherEvaluationDetail>(
      `${this.apiUrl}/teacher/courses/${classId}/evaluations`,
      draft,
    );
  }

  update(evaluationId: string, draft: EvaluationDraft): Observable<TeacherEvaluationDetail> {
    return this.http.put<TeacherEvaluationDetail>(this.url(evaluationId), draft);
  }

  publish(evaluationId: string): Observable<TeacherEvaluationDetail> {
    return this.http.post<TeacherEvaluationDetail>(`${this.url(evaluationId)}/publish`, {});
  }

  addQuestion(evaluationId: string, draft: QuestionDraft): Observable<TeacherQuestion> {
    return this.http.post<TeacherQuestion>(`${this.url(evaluationId)}/questions`, draft);
  }

  updateQuestion(
    evaluationId: string,
    questionId: string,
    draft: QuestionDraft,
  ): Observable<TeacherQuestion> {
    return this.http.put<TeacherQuestion>(
      `${this.url(evaluationId)}/questions/${questionId}`,
      draft,
    );
  }

  deleteQuestion(evaluationId: string, questionId: string): Observable<void> {
    return this.http.delete<void>(`${this.url(evaluationId)}/questions/${questionId}`);
  }
}
