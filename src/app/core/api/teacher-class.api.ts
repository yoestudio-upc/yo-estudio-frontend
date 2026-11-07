import { Observable } from 'rxjs';
import { TeacherClassDetail, TeacherClassSummary } from '../models/dto/teacher.dto';

// Cursos del docente en sesión
export abstract class TeacherClassApi {
  abstract getMyClasses(): Observable<TeacherClassSummary[]>;
  abstract getClass(classId: string): Observable<TeacherClassDetail>;
}
