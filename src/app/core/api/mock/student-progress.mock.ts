import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthService } from '../../auth/auth.service';
import { Goal, StudentProgress } from '../../models/dto/student.dto';
import { StudentProgressApi } from '../student-progress.api';
import { MockDb, fail, respond } from './mock-db';

@Injectable()
export class StudentProgressMockApi extends StudentProgressApi {
  private readonly db = inject(MockDb);
  private readonly auth = inject(AuthService);

  getGoals(): Observable<Goal[]> {
    return respond(this.db.goalsOf(this.me()));
  }

  getProgress(classId: string): Observable<StudentProgress> {
    const me = this.me();
    const course = this.db.classes.find((c) => c.id === classId && c.studentIds.includes(me));
    if (!course) return fail(404);
    const levels = this.db.levelsOf(me, classId);
    const topics = course.topicIds.map((topicId) => {
      const subtopics = this.db.tags
        .filter((t) => t.parentId === topicId)
        .map((t) => ({ id: t.id, code: t.code, name: t.name, level: levels.get(t.id) ?? null }));
      return {
        topic: this.db.tagRef(topicId)!,
        subtopics,
        achieved: subtopics.filter((s) => s.level === 3).length,
      };
    });
    return respond({ classId, topics, profile: this.db.profileOf(me) });
  }

  private me(): string {
    return this.auth.user()?.id ?? '';
  }
}
