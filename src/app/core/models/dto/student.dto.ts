import { AnswerEvent } from '../answer-event';
import { Class } from '../class';
import { Level } from '../level';
import { Evaluation } from '../evaluation';
import { QuestionType } from '../question';
import { TagRef } from './teacher.dto';

// Formas que devuelven los endpoints del portal estudiante.
// Regla 1: ninguna lleva riesgo ni predicción; al alumno todo en positivo.

// GET /me/courses
export interface StudentClassSummary extends Omit<Class, 'teacherId' | 'joinCode'> {
  teacherName: string;
  topics: TagRef[];
  pendingCount: number;
}

export interface StudentEvaluationSummary extends Pick<
  Evaluation,
  'id' | 'name' | 'startDate' | 'endDate'
> {
  topic: TagRef;
  subtopics: TagRef[];
  questionCount: number;
  // Empezó y guardó para seguir luego
  inProgress: boolean;
  done: boolean;
}

export interface SubtopicLevel extends TagRef {
  level: Level;
}

// GET /me/courses/:id → pantalla 03
export interface StudentClassOverview {
  course: StudentClassSummary;
  pending: StudentEvaluationSummary[];
  done: StudentEvaluationSummary[];
  // Meta principal que propone la recomendación (Componente 2)
  nextGoal: (SubtopicLevel & { topicName: string }) | null;
  achievedCount: number;
  lastEvaluationName: string | null;
}

// POST /me/courses/join
export interface JoinClassRequest {
  code: string;
}

// GET /evaluations/:id → para rendir (sin la respuesta correcta ni puntos)
export interface TakeQuestion {
  id: string;
  type: QuestionType;
  subtopicId: string;
  text: string;
  // Vacío en respuesta corta (las respuestas aceptadas nunca llegan al alumno)
  options: { id: string; text: string }[];
}

export interface TakeProgress {
  // Elección única y verdadero o falso: questionId → optionId elegida
  answers: Record<string, string>;
  // Opción múltiple: questionId → optionIds marcadas
  choices?: Record<string, string[]>;
  // Respuesta corta: questionId → lo que escribió
  texts?: Record<string, string>;
  // Preguntas que dejó para después
  skipped: string[];
  currentIndex: number;
}

export interface TakeEvaluation extends Pick<
  Evaluation,
  'id' | 'classId' | 'name' | 'endDate' | 'readingTitle' | 'readingText'
> {
  topic: TagRef;
  subtopics: TagRef[];
  questions: TakeQuestion[];
  progress: TakeProgress | null;
}

// POST /evaluations/:id/telemetry
export type TelemetryBatch = AnswerEvent[];

// POST /evaluations/:id/submit · GET /evaluations/:id/result → pantalla 05
export interface EvaluationResult {
  evaluationId: string;
  classId: string;
  name: string;
  topic: TagRef;
  totalCount: number;
  answeredCount: number;
  correctCount: number;
  subtopics: SubtopicLevel[];
}

// Cómo practicar fuera de la plataforma (salida del DSS); nunca ejercicios dentro de ella
export type PracticeKind = 'written' | 'concrete' | 'reading';

// GET /me/goals → pantalla 06 (metas priorizadas, Componente 2)
export interface Goal {
  priority: number;
  classId: string;
  topic: TagRef;
  subtopic: TagRef;
  level: Level;
  practice: { kind: PracticeKind; text: string };
}

// Perfil de respuesta (K-means sobre telemetría), contado en positivo.
// Los nombres son provisionales (pregunta abierta 7).
export interface ResponseProfile {
  code: string;
  name: string;
  description: string;
}

export interface TopicProgress {
  topic: TagRef;
  // level null = aún no evaluado
  subtopics: (TagRef & { level: Level | null })[];
  achieved: number;
}

// GET /me/progress?courseId= → pantalla 07 (OLM)
export interface StudentProgress {
  classId: string;
  topics: TopicProgress[];
  profile: ResponseProfile | null;
}
