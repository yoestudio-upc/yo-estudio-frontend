import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import {
  EvaluationResult,
  TakeEvaluation,
  TakeProgress,
  TelemetryBatch,
} from '../../models/dto/student.dto';
import { API_URL } from '../api-url';
import { StudentEvaluationApi } from '../student-evaluation.api';

@Injectable()
export class StudentEvaluationHttpApi extends StudentEvaluationApi {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(API_URL);

  private url(evaluationId: string): string {
    return `${this.apiUrl}/evaluations/${evaluationId}`;
  }

  getForTaking(evaluationId: string): Observable<TakeEvaluation> {
    return this.http.get<TakeEvaluation>(this.url(evaluationId));
  }

  saveProgress(evaluationId: string, progress: TakeProgress): Observable<void> {
    return this.http.put<void>(`${this.url(evaluationId)}/progress`, progress);
  }

  sendTelemetry(evaluationId: string, events: TelemetryBatch): Observable<void> {
    return this.http.post<void>(`${this.url(evaluationId)}/telemetry`, events);
  }

  submit(evaluationId: string, progress: TakeProgress): Observable<EvaluationResult> {
    return this.http.post<EvaluationResult>(`${this.url(evaluationId)}/submit`, progress);
  }

  getResult(evaluationId: string): Observable<EvaluationResult> {
    return this.http.get<EvaluationResult>(`${this.url(evaluationId)}/result`);
  }
}
