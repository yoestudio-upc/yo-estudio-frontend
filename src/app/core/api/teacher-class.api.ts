import { Observable } from 'rxjs';
import {
  CreateClassRequest,
  TeacherClassDetail,
  TeacherClassSummary,
  TeacherRef,
} from '../models/dto/teacher.dto';

// Cursos del docente en sesión
export abstract class TeacherClassApi {
  abstract getMyClasses(): Observable<TeacherClassSummary[]>;
  abstract getClass(classId: string): Observable<TeacherClassDetail>;
  // Crea el curso con el docente en sesión y le asigna un código para unirse
  abstract create(request: CreateClassRequest): Observable<TeacherClassSummary>;
  // HU12: agrega otra cuenta docente al curso. 404 = no existe, 409 = ya es docente,
  // 422 { problems } = no es una cuenta docente
  abstract addTeacher(classId: string, username: string): Observable<TeacherRef>;
}
