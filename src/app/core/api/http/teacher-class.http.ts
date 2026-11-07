import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import {
  CreateClassRequest,
  TeacherClassDetail,
  TeacherClassSummary,
  TeacherRef,
} from '../../models/dto/teacher.dto';
import { API_URL } from '../api-url';
import { TeacherClassApi } from '../teacher-class.api';
import { BackendCourse, toTagRefs } from './course-dto';

interface BackendTeacherCourse extends BackendCourse {
  joinCode: string;
  studentCount: number;
}

interface BackendTeacherCourseDetail extends BackendTeacherCourse {
  students: { id: number; name: string }[];
  teachers: { id: number; name: string }[];
}

@Injectable()
export class TeacherClassHttpApi extends TeacherClassApi {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(API_URL);

  getMyClasses(): Observable<TeacherClassSummary[]> {
    return this.http
      .get<BackendTeacherCourse[]>(`${this.apiUrl}/teachers/me/courses`)
      .pipe(map((courses) => courses.map(toSummary)));
  }

  getClass(classId: string): Observable<TeacherClassDetail> {
    return this.http
      .get<BackendTeacherCourseDetail>(`${this.apiUrl}/teachers/me/courses/${classId}`)
      .pipe(
        map((c) => ({
          ...toSummary(c),
          students: c.students.map((s) => ({ id: String(s.id), name: s.name })),
          teachers: c.teachers.map((t) => ({ id: String(t.id), name: t.name })),
        })),
      );
  }

  addTeacher(classId: string, username: string): Observable<TeacherRef> {
    return this.http
      .post<{ id: number; name: string }>(`${this.apiUrl}/teachers/me/courses/${classId}/teachers`, {
        username,
      })
      .pipe(map((t) => ({ id: String(t.id), name: t.name })));
  }

  deleteStudentAccount(classId: string, studentId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/teachers/me/courses/${classId}/students/${studentId}`);
  }

  create(request: CreateClassRequest): Observable<TeacherClassSummary> {
    return this.http
      .post<BackendTeacherCourse>(`${this.apiUrl}/courses`, request)
      .pipe(map(toSummary));
  }
}

function toSummary(c: BackendTeacherCourse): TeacherClassSummary {
  return {
    id: String(c.id),
    name: c.name,
    subject: c.subject,
    grade: c.grade,
    section: c.section,
    joinCode: c.joinCode,
    topics: toTagRefs(c.topics),
    studentCount: c.studentCount,
  };
}
