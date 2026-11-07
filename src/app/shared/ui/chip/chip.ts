import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Tone } from '../tone';

// Etiqueta de tema o subtema
@Component({
  selector: 'ye-chip',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content />',
  styles: `
    :host {
      display: inline-flex;
      align-items: center;
      min-height: 32px;
      padding: 0 14px;
      border-radius: var(--radius-chip);
      font-size: var(--fs-body-sm);
      font-weight: 700;
    }

    :host(.tone-blue) {
      background: var(--tone-blue-chip);
      color: var(--tone-blue-ink);
    }

    :host(.tone-green) {
      background: var(--tone-green-chip);
      color: var(--tone-green-ink);
    }

    :host(.tone-yellow) {
      background: var(--tone-yellow-chip);
      color: var(--tone-yellow-ink);
    }

    :host(.tone-orange) {
      background: var(--tone-orange-chip);
      color: var(--tone-orange-ink);
    }
  `,
  host: { '[class]': '"tone-" + tone()' },
})
export class Chip {
  readonly tone = input<Tone>('blue');
}
