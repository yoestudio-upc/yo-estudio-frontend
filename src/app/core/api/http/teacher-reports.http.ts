import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { EvaluationReport } from '../../models/dto/teacher.dto';
import { API_URL } from '../api-url';
import { TeacherReportsApi } from '../teacher-reports.api';

@Injectable()
export class TeacherReportsHttpApi extends TeacherReportsApi {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(API_URL);

  getResults(evaluationId: string): Observable<EvaluationReport> {
    return this.http.get<EvaluationReport>(
      `${this.apiUrl}/teacher/evaluations/${evaluationId}/results`,
    );
  }
}
