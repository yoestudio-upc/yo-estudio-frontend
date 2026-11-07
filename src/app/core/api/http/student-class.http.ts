import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { StudentClassOverview, StudentClassSummary } from '../../models/dto/student.dto';
import { API_URL } from '../api-url';
import { StudentClassApi } from '../student-class.api';
import { BackendCourse, toTagRefs } from './course-dto';

interface BackendStudentCourse extends BackendCourse {
  teacherName: string;
  pendingCount: number;
}

@Injectable()
export class StudentClassHttpApi extends StudentClassApi {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(API_URL);

  getMyClasses(): Observable<StudentClassSummary[]> {
    return this.http
      .get<BackendStudentCourse[]>(`${this.apiUrl}/students/me/courses`)
      .pipe(map((courses) => courses.map(toSummary)));
  }

  // El backend aún no tiene evaluaciones (HU02) ni metas (HU07): el resumen va vacío
  getOverview(classId: string): Observable<StudentClassOverview> {
    return this.http.get<BackendStudentCourse>(`${this.apiUrl}/students/me/courses/${classId}`).pipe(
      map((c) => ({
        course: toSummary(c),
        pending: [],
        done: [],
        nextGoal: null,
        achievedCount: 0,
        lastEvaluationName: null,
      })),
    );
  }

  join(code: string): Observable<StudentClassSummary> {
    return this.http
      .post<BackendStudentCourse>(`${this.apiUrl}/students/me/courses/join`, { code })
      .pipe(map(toSummary));
  }
}

function toSummary(c: BackendStudentCourse): StudentClassSummary {
  return {
    id: String(c.id),
    name: c.name,
    subject: c.subject,
    grade: c.grade,
    section: c.section,
    teacherName: c.teacherName,
    topics: toTagRefs(c.topics),
    pendingCount: c.pendingCount,
  };
}
