import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthService } from '../../auth/auth.service';
import { TeacherClassDetail, TeacherClassSummary } from '../../models/dto/teacher.dto';
import { TeacherClassApi } from '../teacher-class.api';
import { MockDb, fail, respond } from './mock-db';

@Injectable()
export class TeacherClassMockApi extends TeacherClassApi {
  private readonly db = inject(MockDb);
  private readonly auth = inject(AuthService);

  getMyClasses(): Observable<TeacherClassSummary[]> {
    return respond(this.ownClasses().map((c) => this.toSummary(c)));
  }

  getClass(classId: string): Observable<TeacherClassDetail> {
    // Como el backend: un curso de otro docente responde 404
    const found = this.ownClasses().find((c) => c.id === classId);
    if (!found) return fail(404);
    const students = found.studentIds.flatMap((id) => {
      const s = this.db.students.find((st) => st.id === id);
      return s ? [{ id: s.id, name: s.name }] : [];
    });
    return respond({ ...this.toSummary(found), students });
  }

  private ownClasses() {
    const teacherId = this.auth.user()?.id;
    return this.db.classes.filter((c) => c.teacherId === teacherId);
  }

  private toSummary(c: MockDb['classes'][number]): TeacherClassSummary {
    const { teacherId: _, topicIds, studentIds, ...rest } = c;
    return { ...rest, topics: this.db.tagRefs(topicIds), studentCount: studentIds.length };
  }
}
