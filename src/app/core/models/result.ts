// Entidad Result: una evaluación rendida por un alumno
export interface Result {
  id: string;
  evaluationId: string;
  studentId: string;
  answeredCount: number;
  correctCount: number;
  submittedAt: string;
}
