import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Goal, StudentProgress } from '../../models/dto/student.dto';
import { API_URL } from '../api-url';
import { StudentProgressApi } from '../student-progress.api';

@Injectable()
export class StudentProgressHttpApi extends StudentProgressApi {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(API_URL);

  getGoals(): Observable<Goal[]> {
    return this.http.get<Goal[]>(`${this.apiUrl}/me/goals`);
  }

  getProgress(classId: string): Observable<StudentProgress> {
    return this.http.get<StudentProgress>(`${this.apiUrl}/me/progress`, {
      params: { courseId: classId },
    });
  }
}
