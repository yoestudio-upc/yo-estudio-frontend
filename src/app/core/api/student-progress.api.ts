import { Observable } from 'rxjs';
import { Goal, StudentProgress } from '../models/dto/student.dto';

// Metas (06) y Mi avance / OLM (07). Sin riesgo: al alumno todo en positivo.
export abstract class StudentProgressApi {
  abstract getGoals(): Observable<Goal[]>;
  abstract getProgress(classId: string): Observable<StudentProgress>;
}
