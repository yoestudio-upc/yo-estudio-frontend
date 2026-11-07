import {
  ChangeDetectionStrategy,
  Component,
  Directive,
  computed,
  inject,
  input,
} from '@angular/core';
import { Icon } from '../icon/icon';
import { IconName } from '../icon/icons';

let nextId = 0;

// Campo con etiqueta, ícono y mensaje de error. El <input> nativo va proyectado:
// <ye-text-field label="Usuario" icon="user"><input yeInput formControlName="username" /></ye-text-field>
@Component({
  selector: 'ye-text-field',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon],
  templateUrl: './text-field.html',
  styleUrl: './text-field.scss',
  host: { '[class.has-error]': '!!error()' },
})
export class TextField {
  readonly label = input.required<string>();
  readonly icon = input<IconName>();
  readonly error = input<string | null>(null);

  readonly inputId = `ye-field-${nextId++}`;
  readonly errorId = computed(() => (this.error() ? `${this.inputId}-error` : null));
}

@Directive({
  selector: 'input[yeInput], textarea[yeInput], select[yeInput]',
  host: {
    class: 'ye-input',
    '[id]': 'field.inputId',
    '[attr.aria-describedby]': 'field.errorId()',
    '[attr.aria-invalid]': 'field.error() ? "true" : null',
  },
})
export class TextFieldInput {
  protected readonly field = inject(TextField);
}
