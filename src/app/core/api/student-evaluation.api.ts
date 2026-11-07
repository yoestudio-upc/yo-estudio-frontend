import { Observable } from 'rxjs';
import {
  EvaluationResult,
  TakeEvaluation,
  TakeProgress,
  TelemetryBatch,
} from '../models/dto/student.dto';

// Rendir una evaluación (pantallas 04 y 05). Nunca devuelve la respuesta correcta ni riesgo.
export abstract class StudentEvaluationApi {
  abstract getForTaking(evaluationId: string): Observable<TakeEvaluation>;
  // "Guardar y salir": conserva respuestas y posición
  abstract saveProgress(evaluationId: string, progress: TakeProgress): Observable<void>;
  // Cada lote trae incrementos desde el envío anterior; el backend los suma
  abstract sendTelemetry(evaluationId: string, events: TelemetryBatch): Observable<void>;
  // Termina: el backend calcula nivel, perfil y predicción
  abstract submit(evaluationId: string, progress: TakeProgress): Observable<EvaluationResult>;
  abstract getResult(evaluationId: string): Observable<EvaluationResult>;
}
