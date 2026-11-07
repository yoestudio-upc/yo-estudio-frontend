import { Observable } from 'rxjs';
import {
  EvaluationDraft,
  QuestionDraft,
  TeacherEvaluationDetail,
  TeacherEvaluationSummary,
  TeacherQuestion,
} from '../models/dto/teacher.dto';

// Evaluaciones que crea el docente (D1–D3). Si el backend rechaza una
// publicación por estar incompleta, responde 422 con { problems: string[] }.
export abstract class TeacherEvaluationApi {
  abstract listByClass(classId: string): Observable<TeacherEvaluationSummary[]>;
  abstract get(evaluationId: string): Observable<TeacherEvaluationDetail>;
  // Se crea siempre como borrador
  abstract create(classId: string, draft: EvaluationDraft): Observable<TeacherEvaluationDetail>;
  abstract update(
    evaluationId: string,
    draft: EvaluationDraft,
  ): Observable<TeacherEvaluationDetail>;
  abstract publish(evaluationId: string): Observable<TeacherEvaluationDetail>;

  abstract addQuestion(evaluationId: string, draft: QuestionDraft): Observable<TeacherQuestion>;
  abstract updateQuestion(
    evaluationId: string,
    questionId: string,
    draft: QuestionDraft,
  ): Observable<TeacherQuestion>;
  abstract deleteQuestion(evaluationId: string, questionId: string): Observable<void>;
}
