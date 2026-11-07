import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, map } from 'rxjs';
import {
  StudentClassOverview,
  StudentClassSummary,
  StudentEvaluationSummary,
} from '../../models/dto/student.dto';
import { Level } from '../../models/level';
import { API_URL } from '../api-url';
import { StudentClassApi } from '../student-class.api';
import { BackendCourse, BackendTopicRef, toTagRefs } from './course-dto';

interface BackendStudentCourse extends BackendCourse {
  teacherName: string;
  pendingCount: number;
}

interface BackendStudentEvaluation {
  id: number;
  name: string;
  startDate: string | null;
  endDate: string | null;
  topic: BackendTopicRef;
  subtopics: BackendTopicRef[];
  questionCount: number;
  inProgress: boolean;
  done: boolean;
}

interface BackendCourseEvaluations {
  pending: BackendStudentEvaluation[];
  done: BackendStudentEvaluation[];
  lastEvaluationName: string | null;
  achievedCount: number;
  nextGoal: (BackendTopicRef & { level: Level; topicName: string }) | null;
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

  // Curso + sus evaluaciones, subtemas logrados y la meta principal del plan de refuerzo
  getOverview(classId: string): Observable<StudentClassOverview> {
    const base = `${this.apiUrl}/students/me/courses/${classId}`;
    return forkJoin({
      course: this.http.get<BackendStudentCourse>(base),
      evaluations: this.http.get<BackendCourseEvaluations>(`${base}/evaluations`),
    }).pipe(
      map(({ course, evaluations }) => ({
        course: toSummary(course),
        pending: evaluations.pending.map(toEvaluationSummary),
        done: evaluations.done.map(toEvaluationSummary),
        nextGoal: evaluations.nextGoal
          ? { ...evaluations.nextGoal, id: String(evaluations.nextGoal.id) }
          : null,
        achievedCount: evaluations.achievedCount,
        lastEvaluationName: evaluations.lastEvaluationName,
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

function toEvaluationSummary(e: BackendStudentEvaluation): StudentEvaluationSummary {
  return {
    id: String(e.id),
    name: e.name,
    startDate: e.startDate,
    endDate: e.endDate,
    topic: toTagRefs([e.topic])[0],
    subtopics: toTagRefs(e.subtopics),
    questionCount: e.questionCount,
    inProgress: e.inProgress,
    done: e.done,
  };
}
