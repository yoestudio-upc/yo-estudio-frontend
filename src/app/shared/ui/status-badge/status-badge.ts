import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { EvaluationStatus } from '../../../core/models/evaluation';

const LABELS: Record<EvaluationStatus, string> = {
  draft: 'Borrador',
  scheduled: 'Programada',
  published: 'Publicada',
  closed: 'Cerrada',
};

// Estado de una evaluación del docente (siempre con texto, no solo color)
@Component({
  selector: 'ye-status-badge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '{{ label() }}',
  styles: `
    :host {
      display: inline-flex;
      align-items: center;
      min-height: 26px;
      padding: 0 10px;
      border-radius: 13px;
      font-size: var(--fs-caption);
      font-weight: 800;
      white-space: nowrap;
    }

    :host(.published) {
      background: var(--green-bg);
      color: var(--green);
    }

    :host(.scheduled) {
      background: var(--brand-soft);
      color: var(--brand);
    }

    :host(.closed) {
      background: #e3e6f3;
      color: var(--text-2);
    }

    :host(.draft) {
      background: var(--yellow-bg);
      color: var(--yellow-ink);
    }
  `,
  host: { '[class]': 'status()' },
})
export class StatusBadge {
  readonly status = input.required<EvaluationStatus>();
  protected readonly label = computed(() => LABELS[this.status()]);
}
