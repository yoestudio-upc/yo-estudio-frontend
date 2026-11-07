import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthService } from '../../auth/auth.service';
import {
  StudentClassOverview,
  StudentClassSummary,
  StudentEvaluationSummary,
} from '../../models/dto/student.dto';
import { StudentClassApi } from '../student-class.api';
import { MockEvaluation } from './data/evaluations';
import { MockDb, fail, respond } from './mock-db';

type MockClass = MockDb['classes'][number];

@Injectable()
export class StudentClassMockApi extends StudentClassApi {
  private readonly db = inject(MockDb);
  private readonly auth = inject(AuthService);

  getMyClasses(): Observable<StudentClassSummary[]> {
    const me = this.me();
    return respond(
      this.db.classes.filter((c) => c.studentIds.includes(me)).map((c) => this.summary(c)),
    );
  }

  getOverview(classId: string): Observable<StudentClassOverview> {
    const me = this.me();
    const course = this.db.classes.find((c) => c.id === classId && c.studentIds.includes(me));
    if (!course) return fail(404);

    const visible = this.db.evaluations.filter(
      (e) => e.classId === classId && e.topicId && this.db.statusOf(e) !== 'draft',
    );
    const done = visible.filter((e) => this.db.resultOf(e.id, me));
    const pending = visible.filter(
      (e) => this.db.statusOf(e) === 'published' && !this.db.resultOf(e.id, me),
    );

    // La meta principal del curso es la primera de "Mis metas" que le corresponde
    const levels = this.db.levelsOf(me, classId);
    const goal = this.db.goalsOf(me).find((g) => g.classId === classId);
    const lastResult = this.db.results
      .filter((r) => r.studentId === me && done.some((e) => e.id === r.evaluationId))
      .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))[0];

    return respond({
      course: this.summary(course),
      pending: pending.map((e) => this.evaluationSummary(e, me)),
      done: done.map((e) => this.evaluationSummary(e, me)),
      nextGoal: goal ? { ...goal.subtopic, level: goal.level, topicName: goal.topic.name } : null,
      achievedCount: [...levels.values()].filter((l) => l === 3).length,
      lastEvaluationName:
        this.db.evaluations.find((e) => e.id === lastResult?.evaluationId)?.name ?? null,
    });
  }

  join(code: string): Observable<StudentClassSummary> {
    const me = this.me();
    const course = this.db.classes.find((c) => c.joinCode === code.trim().toUpperCase());
    if (!course) return fail(404);
    if (course.studentIds.includes(me)) return fail(409);
    course.studentIds.push(me);
    this.db.save();
    return respond(this.summary(course));
  }

  private me(): string {
    return this.auth.user()?.id ?? '';
  }

  private summary(c: MockClass): StudentClassSummary {
    const me = this.me();
    const teacher = this.db.teachers.find((t) => t.id === c.teacherId);
    return {
      id: c.id,
      name: c.name,
      subject: c.subject,
      grade: c.grade,
      section: c.section,
      teacherName: teacher?.name ?? '',
      topics: this.db.tagRefs(c.topicIds),
      pendingCount: this.db.evaluations.filter(
        (e) =>
          e.classId === c.id && this.db.statusOf(e) === 'published' && !this.db.resultOf(e.id, me),
      ).length,
    };
  }

  private evaluationSummary(e: MockEvaluation, me: string): StudentEvaluationSummary {
    return {
      id: e.id,
      name: e.name,
      startDate: e.startDate,
      endDate: e.endDate,
      topic: this.db.tagRef(e.topicId)!,
      subtopics: this.db.tagRefs(e.subtopicIds),
      questionCount: e.questions.length,
      inProgress: this.db.progress.has(`${e.id}:${me}`),
      done: !!this.db.resultOf(e.id, me),
    };
  }
}
