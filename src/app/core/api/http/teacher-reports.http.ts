import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { EvaluationReport, StudentDiagnostic } from '../../models/dto/teacher.dto';
import { Level } from '../../models/level';
import { API_URL } from '../api-url';
import { TeacherReportsApi } from '../teacher-reports.api';
import { BackendTopicRef, toTagRefs } from './course-dto';

// Formas del backend: mismos campos que los DTO, con ids numéricos
type BackendStudentDiagnostic = Omit<StudentDiagnostic, 'studentId' | 'subtopics'> & {
  studentId: number;
  subtopics: (BackendTopicRef & { level: Level | null })[];
};

interface BackendReport {
  evaluation: Omit<EvaluationReport['evaluation'], 'id' | 'topic'> & {
    id: number;
    topic: BackendTopicRef;
  };
  course: Omit<EvaluationReport['course'], 'id'> & { id: number };
  students: BackendStudentDiagnostic[];
}

@Injectable()
export class TeacherReportsHttpApi extends TeacherReportsApi {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(API_URL);

  getResults(evaluationId: string): Observable<EvaluationReport> {
    return this.http
      .get<BackendReport>(`${this.apiUrl}/teachers/me/evaluations/${evaluationId}/results`)
      .pipe(
        map(({ evaluation, course, students }) => ({
          evaluation: {
            ...evaluation,
            id: String(evaluation.id),
            topic: toTagRefs([evaluation.topic])[0],
          },
          course: { ...course, id: String(course.id) },
          students: students.map((s) => ({
            ...s,
            studentId: String(s.studentId),
            subtopics: s.subtopics.map((t) => ({ ...toTagRefs([t])[0], level: t.level })),
          })),
        })),
      );
  }
}
