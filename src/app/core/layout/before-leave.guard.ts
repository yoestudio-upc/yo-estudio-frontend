import { CanDeactivateFn } from '@angular/router';

export interface BeforeLeave {
  // Guarda lo necesario antes de salir; true = se puede salir
  beforeLeave(): Promise<boolean> | boolean;
}

// Al salir de la evaluación por cualquier camino (atrás, menú, Salir) se guarda el avance
export const beforeLeaveGuard: CanDeactivateFn<BeforeLeave> = (component) =>
  component.beforeLeave();
