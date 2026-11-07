// Nivel por subtema: 1 En inicio · 2 En proceso · 3 Logrado (sale solo de los aciertos)
export type Level = 1 | 2 | 3;

// Al estudiante: estrellas + texto (regla 2)
export const LEVEL_LABEL: Record<Level, string> = {
  1: 'Empezando',
  2: 'Avanzando',
  3: '¡Logrado!',
};

// Mensajes en positivo de la pantalla 05
export const LEVEL_CHEER: Record<Level, string> = {
  1: 'Vamos a practicarlo',
  2: '¡Ya casi!',
  3: '¡Lo lograste!',
};

// Al docente: nombres del documento de tesis
export const TEACHER_LEVEL_LABEL: Record<Level, string> = {
  1: 'En inicio',
  2: 'En proceso',
  3: 'Logrado',
};

// Riesgo = que el alumno quede "En inicio" en la siguiente evaluación del tema.
// SOLO lo ve el docente (regla 1).
export type RiskLevel = 'low' | 'medium' | 'high';
