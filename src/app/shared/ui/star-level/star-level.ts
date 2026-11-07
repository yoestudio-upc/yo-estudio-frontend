import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { LEVEL_LABEL, Level } from '../../../core/models/level';

const STAR = 'M12 3l2.7 5.5 6 .9-4.4 4.2 1.1 6L12 16.8l-5.4 2.8 1.1-6L3.3 9.4l6-.9z';

// Nivel en estrellas (1–3), siempre con texto (regla 2). Con showLabel=false
// el texto lo pone quien lo usa (ej. "¡Ya casi!" en la pantalla 05).
@Component({
  selector: 'ye-star-level',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="stars" role="img" [attr.aria-label]="ariaLabel()">
      @for (filled of stars(); track $index) {
        <svg [attr.width]="size()" [attr.height]="size()" viewBox="0 0 24 24" aria-hidden="true">
          <path [attr.d]="star" [class.filled]="filled" />
        </svg>
      }
    </span>
    @if (showLabel()) {
      <span class="label">{{ label() }}</span>
    }
  `,
  styles: `
    :host {
      display: inline-flex;
      flex-shrink: 0;
      align-items: center;
      gap: var(--space-2);
    }

    .stars {
      display: inline-flex;
      gap: 2px;
    }

    path {
      fill: var(--surface);
      stroke: var(--star-empty-stroke);
      stroke-width: 1.4;
      stroke-linejoin: round;
    }

    path.filled {
      fill: var(--star);
      stroke: var(--star-stroke);
    }

    .label {
      font-size: var(--fs-body-sm);
      font-weight: 700;
    }
  `,
})
export class StarLevel {
  readonly level = input.required<Level>();
  readonly size = input(26);
  readonly showLabel = input(true);

  protected readonly star = STAR;
  protected readonly stars = computed(() => [1, 2, 3].map((n) => n <= this.level()));
  protected readonly label = computed(() => LEVEL_LABEL[this.level()]);
  protected readonly ariaLabel = computed(() => `${this.level()} de 3 estrellas: ${this.label()}`);
}
