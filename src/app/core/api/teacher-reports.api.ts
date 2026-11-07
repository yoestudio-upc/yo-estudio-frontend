import { Observable } from 'rxjs';
import { EvaluationReport } from '../models/dto/teacher.dto';

// Resultados por alumno con nivel, riesgo y explicación SHAP (HU04, HU08, HU11).
// Es el ÚNICO contrato que trae riesgo, y solo existe en el portal docente.
export abstract class TeacherReportsApi {
  abstract getResults(evaluationId: string): Observable<EvaluationReport>;
}
