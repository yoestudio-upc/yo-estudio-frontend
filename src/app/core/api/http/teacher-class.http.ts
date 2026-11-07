import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { TeacherClassDetail, TeacherClassSummary } from '../../models/dto/teacher.dto';
import { API_URL } from '../api-url';
import { TeacherClassApi } from '../teacher-class.api';

@Injectable()
export class TeacherClassHttpApi extends TeacherClassApi {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(API_URL);

  getMyClasses(): Observable<TeacherClassSummary[]> {
    return this.http.get<TeacherClassSummary[]>(`${this.apiUrl}/teacher/courses`);
  }

  getClass(classId: string): Observable<TeacherClassDetail> {
    return this.http.get<TeacherClassDetail>(`${this.apiUrl}/teacher/courses/${classId}`);
  }
}
