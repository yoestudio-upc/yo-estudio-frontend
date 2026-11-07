import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthService } from '../../auth/auth.service';
import {
  CreateClassRequest,
  TeacherClassDetail,
  TeacherClassSummary,
  TeacherRef,
} from '../../models/dto/teacher.dto';
import { SUBJECT_NAMES } from '../../models/tag';
import { TeacherClassApi } from '../teacher-class.api';
import { MockDb, fail, respond } from './mock-db';

// Como el backend: sin 0/O ni 1/I para que el código se lea y escriba sin dudas
const JOIN_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

// Cuentas para probar "Agregar docente" con mocks (solo existe este directorio en el mock)
const MOCK_TEACHER_ACCOUNTS: Record<string, string> = { 'luis.paz': 'Luis Paz' };
const MOCK_STUDENT_ACCOUNTS = ['camila.rojas', 'mateo.quispe'];

@Injectable()
export class TeacherClassMockApi extends TeacherClassApi {
  private readonly db = inject(MockDb);
  private readonly auth = inject(AuthService);
  // Docentes agregados en esta sesión (el mock no los guarda en localStorage)
  private readonly coTeachers = new Map<string, TeacherRef[]>();

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
    return respond({ ...this.toSummary(found), students, teachers: this.teachersOf(found) });
  }

  addTeacher(classId: string, username: string): Observable<TeacherRef> {
    const found = this.ownClasses().find((c) => c.id === classId);
    if (!found) return fail(404);
    const key = username.trim().toLowerCase();
    if (MOCK_STUDENT_ACCOUNTS.includes(key)) return fail(422, { problems: ['Ese usuario no es docente.'] });
    const name = key === 'rosa.diaz' ? 'Rosa Díaz' : MOCK_TEACHER_ACCOUNTS[key];
    if (!name) return fail(404);
    if (this.teachersOf(found).some((t) => t.name === name)) return fail(409);
    const added = { id: `t-${key}`, name };
    this.coTeachers.set(classId, [...(this.coTeachers.get(classId) ?? []), added]);
    return respond(added);
  }

  private teachersOf(c: MockDb['classes'][number]): TeacherRef[] {
    const owner = this.db.teachers.find((t) => t.id === c.teacherId);
    return [...(owner ? [{ id: owner.id, name: owner.name }] : []), ...(this.coTeachers.get(c.id) ?? [])];
  }

  create({ subject, grade, section }: CreateClassRequest): Observable<TeacherClassSummary> {
    const course: MockDb['classes'][number] = {
      id: `c-${Date.now()}`,
      name: SUBJECT_NAMES[subject],
      subject,
      grade,
      section: section.trim().toUpperCase(),
      teacherId: this.auth.user()?.id ?? '',
      joinCode: this.newJoinCode(),
      topicIds: [],
      studentIds: [],
    };
    this.db.classes.push(course);
    this.db.save();
    return respond(this.toSummary(course));
  }

  private newJoinCode(): string {
    let code: string;
    do {
      code = Array.from(
        { length: 6 },
        () => JOIN_CODE_ALPHABET[Math.floor(Math.random() * JOIN_CODE_ALPHABET.length)],
      ).join('');
    } while (this.db.classes.some((c) => c.joinCode === code));
    return code;
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
