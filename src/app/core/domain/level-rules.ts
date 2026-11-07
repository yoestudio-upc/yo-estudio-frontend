import { Level } from '../models/level';

// Regla de nivel (docs/06-arquitectura.md §3): dominio = (aciertos + 1) / (intentos + 2).
// Los cortes son provisionales: los define el módulo ML del backend.
export const LEVEL_CUTS = { inProgress: 0.5, achieved: 0.75 };

export function mastery(correct: number, attempts: number): number {
  return (correct + 1) / (attempts + 2);
}

export function levelOf(correct: number, attempts: number): Level {
  return levelFromMastery(mastery(correct, attempts));
}

export function levelFromMastery(m: number): Level {
  if (m >= LEVEL_CUTS.achieved) return 3;
  if (m >= LEVEL_CUTS.inProgress) return 2;
  return 1;
}
