// Entidad Option. `correct` solo viaja en el portal docente.
export interface Option {
  id: string;
  questionId: string;
  text: string;
  correct: boolean;
}
