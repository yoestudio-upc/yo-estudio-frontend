import { inject } from '@angular/core';
import { CanDeactivateFn } from '@angular/router';
import { Confirm } from '../../shared/ui/confirm-dialog/confirm-dialog';

export interface HasUnsavedChanges {
  hasUnsavedChanges(): boolean;
}

// Pregunta antes de salir de un formulario con cambios sin guardar
export const unsavedChangesGuard: CanDeactivateFn<HasUnsavedChanges> = (component) => {
  if (!component.hasUnsavedChanges()) return true;
  return inject(Confirm).ask({
    title: '¿Salir sin guardar?',
    message: 'Hay cambios que todavía no guardaste. Si sales ahora, se perderán.',
    confirmLabel: 'Salir sin guardar',
    cancelLabel: 'Seguir editando',
    destructive: true,
  });
};
