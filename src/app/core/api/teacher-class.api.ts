import { Observable } from 'rxjs';
import {
  CreateClassRequest,
  TeacherClassDetail,
  TeacherClassSummary,
} from '../models/dto/teacher.dto';

// Cursos del docente en sesión
export abstract class TeacherClassApi {
  abstract getMyClasses(): Observable<TeacherClassSummary[]>;
  abstract getClass(classId: string): Observable<TeacherClassDetail>;
  // Crea el curso con el docente en sesión y le asigna un código para unirse
  abstract create(request: CreateClassRequest): Observable<TeacherClassSummary>;
}
