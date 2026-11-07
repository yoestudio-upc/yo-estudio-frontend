import { DIALOG_DATA, Dialog, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { Button } from '../button/button';

export interface ConfirmData {
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  // Acción que borra o descarta algo
  destructive?: boolean;
}

// Diálogo modal (CDK: foco atrapado, Escape cierra, devuelve el foco al salir)
@Component({
  selector: 'ye-confirm-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Button],
  template: `
    <h2 id="confirm-title">{{ data.title }}</h2>
    <p>{{ data.message }}</p>
    <div class="actions">
      <!-- Cancelar va primero: recibe el foco inicial -->
      <button yeButton variant="white" size="sm" type="button" (click)="ref.close(false)">
        {{ data.cancelLabel ?? 'Cancelar' }}
      </button>
      <button
        yeButton
        size="sm"
        type="button"
        [class.destructive]="data.destructive"
        (click)="ref.close(true)"
      >
        {{ data.confirmLabel }}
      </button>
    </div>
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      gap: var(--space-3);
      width: min(440px, calc(100vw - 32px));
      padding: 28px;
      border-radius: var(--radius-card);
      background: var(--surface);
      box-shadow: var(--shadow-card);
    }

    h2 {
      font-size: 22px;
      font-weight: 800;
    }

    p {
      color: var(--text-2);
    }

    .actions {
      display: flex;
      justify-content: flex-end;
      gap: var(--space-3);
      margin-top: var(--space-3);
    }

    .actions [yeButton]:first-child {
      border-color: var(--border);
    }

    .destructive {
      --btn-bg: var(--orange-ink);
      --btn-shadow-color: #5c2a06;
    }
  `,
})
export class ConfirmDialog {
  protected readonly data = inject<ConfirmData>(DIALOG_DATA);
  protected readonly ref = inject<DialogRef<boolean>>(DialogRef);
}

@Injectable({ providedIn: 'root' })
export class Confirm {
  private readonly dialog = inject(Dialog);

  async ask(data: ConfirmData): Promise<boolean> {
    const ref = this.dialog.open<boolean>(ConfirmDialog, {
      data,
      role: 'alertdialog',
      ariaLabelledBy: 'confirm-title',
      autoFocus: 'first-tabbable',
      restoreFocus: true,
    });
    return (await firstValueFrom(ref.closed)) === true;
  }
}
