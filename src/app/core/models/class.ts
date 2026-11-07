import { Subject } from './tag';

// Entidad Class: "curso" en la UI (ej. "Matemática · 4.° B")
export interface Class {
  id: string;
  name: string;
  subject: Subject;
  grade: number;
  section: string;
  teacherId: string;
  // Código con el que el alumno se une al curso
  joinCode: string;
}
