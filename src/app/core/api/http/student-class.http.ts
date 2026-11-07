import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { StudentClassOverview, StudentClassSummary } from '../../models/dto/student.dto';
import { API_URL } from '../api-url';
import { StudentClassApi } from '../student-class.api';

@Injectable()
export class StudentClassHttpApi extends StudentClassApi {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(API_URL);

  getMyClasses(): Observable<StudentClassSummary[]> {
    return this.http.get<StudentClassSummary[]>(`${this.apiUrl}/me/courses`);
  }

  getOverview(classId: string): Observable<StudentClassOverview> {
    return this.http.get<StudentClassOverview>(`${this.apiUrl}/me/courses/${classId}`);
  }

  join(code: string): Observable<StudentClassSummary> {
    return this.http.post<StudentClassSummary>(`${this.apiUrl}/me/courses/join`, { code });
  }
}
