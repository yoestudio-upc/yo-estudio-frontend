import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthService } from '../../auth/auth.service';
import { EvaluationReport, StudentDiagnostic } from '../../models/dto/teacher.dto';
import { TeacherReportsApi } from '../teacher-reports.api';
import { TEACHER_PROFILE_NOTE } from './data/recommendation';
import { diagnose } from './diagnostics';
import { MockDb, fail, respond } from './mock-db';

@Injectable()
export class TeacherReportsMockApi extends TeacherReportsApi {
  private readonly db = inject(MockDb);
  private readonly auth = inject(AuthService);

  getResults(evaluationId: string): Observable<EvaluationReport> {
    const e = this.db.evaluations.find((ev) => ev.id === evaluationId);
    const course = this.db.classes.find(
      (c) => c.id === e?.classId && c.teacherId === this.auth.user()?.id,
    );
    if (!e || !course || !e.topicId) return fail(404);
    const topicId = e.topicId;

    const students = course.studentIds.map((studentId): StudentDiagnostic => {
      const name = this.db.students.find((s) => s.id === studentId)?.name ?? '';
      const result = this.db.resultOf(e.id, studentId);
      const levels = this.db.levelsOf(studentId, course.id);
      const diagnostic = result ? diagnose(this.db, studentId, course.id, topicId) : null;
      const profile = result ? this.db.profileOf(studentId) : null;
      return {
        studentId,
        name,
        done: !!result,
        correctCount: result
          ? e.questions.filter((q) =>
              q.options.some((o) => o.correct && o.id === result.answers[q.id]),
            ).length
          : null,
        topicLevel: diagnostic?.topicLevel ?? null,
        subtopics: this.db
          .tagRefs(e.subtopicIds)
          .map((s) => ({ ...s, level: result ? (levels.get(s.id) ?? null) : null })),
        prediction: diagnostic?.prediction ?? null,
        factors: diagnostic?.factors ?? [],
        profile: profile
          ? { name: profile.name, note: TEACHER_PROFILE_NOTE[profile.code] ?? '' }
          : null,
        goals: result
          ? this.db
              .goalsOf(studentId)
              .filter((g) => g.classId === course.id)
              .slice(0, 3)
              .map((g) => ({ subtopic: g.subtopic.name, practice: g.practice.text }))
          : [],
      };
    });

    return respond({
      evaluation: {
        id: e.id,
        name: e.name,
        status: this.db.statusOf(e),
        startDate: e.startDate,
        endDate: e.endDate,
        topic: this.db.tagRef(topicId)!,
        questionCount: e.questions.length,
      },
      course: { id: course.id, name: course.name, grade: course.grade, section: course.section },
      students,
    });
  }
}
