import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { ICONS, IconDef, IconName } from './icons';

// Decorativo por defecto; con `label` se anuncia como imagen
@Component({
  selector: 'ye-icon',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg
      [attr.width]="size()"
      [attr.height]="size()"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      [attr.stroke-width]="strokeWidth() ?? def().strokeWidth ?? 2.2"
      stroke-linecap="round"
      stroke-linejoin="round"
      focusable="false"
      [attr.aria-hidden]="label() ? null : 'true'"
      [attr.role]="label() ? 'img' : null"
      [attr.aria-label]="label() ?? null"
    >
      @for (d of def().paths; track $index) {
        <path [attr.d]="d" />
      }
      @for (d of def().filled ?? []; track $index) {
        <path [attr.d]="d" fill="currentColor" />
      }
    </svg>
  `,
  styles: `
    :host {
      display: inline-flex;
      flex-shrink: 0;
    }
  `,
})
export class Icon {
  readonly name = input.required<IconName>();
  readonly size = input(24);
  readonly strokeWidth = input<number>();
  readonly label = input<string>();

  protected readonly def = computed<IconDef>(() => ICONS[this.name()]);
}
