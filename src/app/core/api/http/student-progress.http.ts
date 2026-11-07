import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { Goal, StudentProgress } from '../../models/dto/student.dto';
import { API_URL } from '../api-url';
import { StudentProgressApi } from '../student-progress.api';
import { BackendTopicRef, toTagRefs } from './course-dto';

// Forma del backend: mismos campos que Goal, con ids numéricos
type BackendGoal = Omit<Goal, 'classId' | 'topic' | 'subtopic'> & {
  classId: number;
  topic: BackendTopicRef;
  subtopic: BackendTopicRef;
};

@Injectable()
export class StudentProgressHttpApi extends StudentProgressApi {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(API_URL);

  // Plan de refuerzo priorizado de todos sus cursos (HU07)
  getGoals(): Observable<Goal[]> {
    return this.http.get<BackendGoal[]>(`${this.apiUrl}/students/me/goals`).pipe(
      map((goals) =>
        goals.map((g) => ({
          ...g,
          classId: String(g.classId),
          topic: toTagRefs([g.topic])[0],
          subtopic: toTagRefs([g.subtopic])[0],
        })),
      ),
    );
  }

  getProgress(classId: string): Observable<StudentProgress> {
    return this.http.get<StudentProgress>(`${this.apiUrl}/me/progress`, {
      params: { courseId: classId },
    });
  }
}
