import { Observable } from 'rxjs';
import { StudentClassOverview, StudentClassSummary } from '../models/dto/student.dto';

// Cursos del estudiante en sesión. Unirse con un código inexistente → 404; si ya está → 409.
export abstract class StudentClassApi {
  abstract getMyClasses(): Observable<StudentClassSummary[]>;
  abstract getOverview(classId: string): Observable<StudentClassOverview>;
  abstract join(code: string): Observable<StudentClassSummary>;
}
