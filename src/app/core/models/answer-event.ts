// Entidad AnswerEvent: telemetría por pregunta (invisible para el alumno).
// Alimenta el perfil de respuesta (K-means); no cambia el nivel.
export interface AnswerEvent {
  questionId: string;
  // Tiempo total con la pregunta en pantalla (pestaña visible)
  timeMs: number;
  // Veces que cambió de opción después de elegir una
  optionChanges: number;
  // La dejó para después al menos una vez
  skipped: boolean;
  // Veces que volvió a la pregunta después de la primera visita
  revisits: number;
}
