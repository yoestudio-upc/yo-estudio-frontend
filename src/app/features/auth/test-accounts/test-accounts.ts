import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Injector,
  afterNextRender,
  inject,
  signal,
} from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { TestAccount, TestAccountsApi } from '../../../core/api/test-accounts.api';
import { Role } from '../../../core/models/user';
import { Button } from '../../../shared/ui/button/button';
import { Card } from '../../../shared/ui/card/card';
import { Icon } from '../../../shared/ui/icon/icon';
import { TextField, TextFieldInput } from '../../../shared/ui/text-field/text-field';

// Igual que el backend: se guarda en minúsculas y sin espacios alrededor
export const USERNAME_MAX = 11;
const USERNAME_PATTERN = /^[a-z0-9._-]+$/;
const PASSWORD_MIN = 4;

export function normalizeUsername(value: string): string {
  return value.trim().toLowerCase();
}

function usernameValidator(control: AbstractControl<string>): ValidationErrors | null {
  const value = normalizeUsername(control.value ?? '');
  return !value || USERNAME_PATTERN.test(value) ? null : { username: true };
}

const ROLE_LABEL: Record<Role, string> = { docente: 'Docente', estudiante: 'Estudiante' };

type Field = 'firstName' | 'lastName' | 'username' | 'password';

// Cuentas de prueba: solo para probar la plataforma. En el piloto se quita (environment.testAccounts)
// y el docente crea las cuentas de sus estudiantes.
@Component({
  selector: 'ye-test-accounts',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink, Button, Card, Icon, TextField, TextFieldInput],
  templateUrl: './test-accounts.html',
  styleUrl: './test-accounts.scss',
})
export class TestAccounts {
  private readonly api = inject(TestAccountsApi);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);

  protected readonly status = rxResource({ stream: () => this.api.enabled() });
  protected readonly roleLabel = ROLE_LABEL;
  protected readonly usernameMax = USERNAME_MAX;

  private readonly fb = inject(NonNullableFormBuilder);
  protected readonly form = this.fb.group({
    role: this.fb.control<Role>('estudiante'),
    firstName: ['', [Validators.required, Validators.maxLength(20)]],
    lastName: ['', [Validators.required, Validators.maxLength(60)]],
    username: ['', [Validators.required, Validators.maxLength(USERNAME_MAX), usernameValidator]],
    password: ['', [Validators.required, Validators.minLength(PASSWORD_MIN), Validators.maxLength(72)]],
  });

  protected readonly submitted = signal(false);
  protected readonly busy = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly notice = signal<string | null>(null);
  // Cuentas creadas en esta visita, para tenerlas a mano al probar
  protected readonly created = signal<TestAccount[]>([]);

  protected fieldError(name: Field): string | null {
    const control = this.form.controls[name];
    if (!this.submitted() || control.valid) return null;
    if (control.hasError('required')) {
      return {
        firstName: 'Escribe el nombre.',
        lastName: 'Escribe el apellido.',
        username: 'Escribe el usuario.',
        password: 'Escribe una contraseña.',
      }[name];
    }
    if (control.hasError('username')) {
      return 'Usa solo letras sin tildes, números, punto, guion o guion bajo.';
    }
    if (control.hasError('minlength')) return `Usa al menos ${PASSWORD_MIN} caracteres.`;
    return 'Es demasiado largo.';
  }

  protected async submit(): Promise<void> {
    if (this.busy()) return;
    this.submitted.set(true);
    this.error.set(null);
    this.notice.set(null);
    if (this.form.invalid) {
      this.focus('[aria-invalid="true"]');
      return;
    }
    const value = this.form.getRawValue();
    const request = {
      ...value,
      firstName: value.firstName.trim(),
      lastName: value.lastName.trim(),
      username: normalizeUsername(value.username),
    };
    this.busy.set(true);
    try {
      const account = await firstValueFrom(this.api.create(request));
      this.created.update((list) => [account, ...list]);
      this.notice.set(
        `¡Listo! Creaste la cuenta de ${ROLE_LABEL[account.role].toLowerCase()} «${account.username}». ` +
          'Ya puede entrar con su usuario y contraseña.',
      );
      this.form.reset({ role: value.role });
      this.submitted.set(false);
      this.focus('#test-first-name');
    } catch (error) {
      const status = error instanceof HttpErrorResponse ? error.status : 0;
      this.error.set(
        status === 400
          ? `Ya existe una cuenta con el usuario «${request.username}». Elige otro.`
          : status === 404
            ? 'La creación de cuentas de prueba está apagada en este servidor.'
            : status === 422
              ? 'Revisa los datos de la cuenta.'
              : 'No pudimos conectarnos. Intenta otra vez en un momento.',
      );
    } finally {
      this.busy.set(false);
    }
  }

  private focus(selector: string): void {
    afterNextRender(() => this.host.nativeElement.querySelector<HTMLElement>(selector)?.focus(), {
      injector: this.injector,
    });
  }
}
