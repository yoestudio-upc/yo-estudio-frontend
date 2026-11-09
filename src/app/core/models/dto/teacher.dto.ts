import { Class } from '../class';
import { Evaluation } from '../evaluation';
import { Option } from '../option';
import { Question } from '../question';
import { Level } from '../level';
import { Subject, Tag } from '../tag';

// Formas que devuelven y reciben los endpoints del portal docente

export type TagRef = Pick<Tag, 'id' | 'code' | 'name'>;

// GET /tags?subject= → temas con sus subtemas
export interface CatalogTopic extends TagRef {
  subject: Subject;
  subtopics: TagRef[];
}

export interface StudentRef {
  id: string;
  name: string;
}

// Docente de un curso (HU12)
export interface TeacherRef {
  id: string;
  name: string;
}

// POST /courses (HU09): el nombre del curso es el del área
export interface CreateClassRequest {
  subject: Subject;
  grade: number;
  section: string;
}

// GET /teacher/courses
export interface TeacherClassSummary extends Omit<Class, 'teacherId'> {
  topics: TagRef[];
  studentCount: number;
}

// GET /teacher/courses/:id
export interface TeacherClassDetail extends TeacherClassSummary {
  students: StudentRef[];
  // La creadora primero
  teachers: TeacherRef[];
}

// GET /teacher/courses/:id/evaluations
export interface TeacherEvaluationSummary extends Evaluation {
  // Un tema por evaluación (null mientras es borrador sin tema)
  topic: TagRef | null;
  questionCount: number;
  // Cuántos alumnos ya la rindieron
  completedCount: number;
  studentCount: number;
}

export interface TeacherQuestion extends Omit<Question, 'evaluationId'> {
  // Vacío en respuesta corta
  options: Omit<Option, 'questionId'>[];
  // Solo respuesta corta
  acceptedAnswers: string[];
}

// GET /teacher/evaluations/:id
export interface TeacherEvaluationDetail extends Evaluation {
  topic: TagRef | null;
  subtopics: TagRef[];
  questions: TeacherQuestion[];
}

// POST /teacher/courses/:id/evaluations · PUT /teacher/evaluations/:id
export interface EvaluationDraft {
  name: string;
  topicId: string | null;
  subtopicIds: string[];
  startDate: string | null;
  endDate: string | null;
  readingTitle: string | null;
  readingText: string | null;
}

// POST /teacher/evaluations/:id/questions · PUT …/questions/:questionId
export interface QuestionDraft {
  type: Question['type'];
  subtopicId: string | null;
  text: string;
  points: number | null;
  // Elección única, verdadero o falso y opción múltiple
  options: { text: string; correct: boolean }[];
  // Respuesta corta (1 a 5)
  acceptedAnswers: string[];
}

// ── Resultados por alumno (única vista con riesgo; solo docente) ──

// Factor de la explicación SHAP: weight < 0 aumenta el riesgo, > 0 lo reduce
export interface ShapFactor {
  label: string;
  weight: number;
}

export interface StudentDiagnostic {
  studentId: string;
  name: string;
  done: boolean;
  correctCount: number | null;
  // Nivel actual en el tema (sale de sus subtemas)
  topicLevel: Level | null;
  subtopics: (TagRef & { level: Level | null })[];
  // Random Forest: nivel previsto en la siguiente evaluación del tema
  // En riesgo (OB2 8.1): se prevé que quede "En inicio". SOLO lo ve el docente (regla 1)
  prediction: { level: Level; atRisk: boolean } | null;
  factors: ShapFactor[];
  profile: { name: string; note: string } | null;
  goals: { subtopic: string; practice: string }[];
}

// GET /teacher/evaluations/:id/results
export interface EvaluationReport {
  evaluation: Pick<Evaluation, 'id' | 'name' | 'status' | 'startDate' | 'endDate'> & {
    topic: TagRef;
    questionCount: number;
  };
  course: Pick<Class, 'id' | 'name' | 'grade' | 'section'>;
  students: StudentDiagnostic[];
}
