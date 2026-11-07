import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { Goal, StudentProgress } from '../../models/dto/student.dto';
import { Level } from '../../models/level';
import { API_URL } from '../api-url';
import { StudentProgressApi } from '../student-progress.api';
import { BackendTopicRef, toTagRefs } from './course-dto';

// Forma del backend: mismos campos que Goal, con ids numéricos
type BackendGoal = Omit<Goal, 'classId' | 'topic' | 'subtopic'> & {
  classId: number;
  topic: BackendTopicRef;
  subtopic: BackendTopicRef;
};

interface BackendProgress {
  classId: number;
  topics: {
    topic: BackendTopicRef;
    subtopics: (BackendTopicRef & { level: Level | null })[];
    achieved: number;
  }[];
  profile: StudentProgress['profile'];
}

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
    return this.http
      .get<BackendProgress>(`${this.apiUrl}/students/me/courses/${classId}/progress`)
      .pipe(
        map((p) => ({
          classId: String(p.classId),
          topics: p.topics.map((t) => ({
            topic: toTagRefs([t.topic])[0],
            subtopics: t.subtopics.map((s) => ({ ...toTagRefs([s])[0], level: s.level })),
            achieved: t.achieved,
          })),
          profile: p.profile,
        })),
      );
  }
}
