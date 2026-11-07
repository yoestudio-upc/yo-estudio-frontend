// Borrador = aún no publicada (no figura en el diseño, pero D2 permite guardarla así)
export type EvaluationStatus = 'draft' | 'scheduled' | 'published' | 'closed';

// Entidad Evaluation. Fechas 'YYYY-MM-DD'; un borrador puede no tenerlas aún.
export interface Evaluation {
  id: string;
  classId: string;
  name: string;
  startDate: string | null;
  endDate: string | null;
  status: EvaluationStatus;
  // Texto de lectura opcional, común a todas las preguntas (ej. un cuento corto)
  readingTitle: string | null;
  readingText: string | null;
}
