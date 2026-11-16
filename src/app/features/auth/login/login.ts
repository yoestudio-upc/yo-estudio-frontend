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
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { AuthService } from '../../../core/auth/auth.service';
import { ROLE_HOME } from '../../../core/auth/role-home';
import { Button } from '../../../shared/ui/button/button';
import { Card } from '../../../shared/ui/card/card';
import { Icon } from '../../../shared/ui/icon/icon';
import { TextField, TextFieldInput } from '../../../shared/ui/text-field/text-field';
import { Yoyo } from '../../../shared/ui/yoyo/yoyo';

// 01 · Ingreso: el mismo para docente y estudiante; el rol del JWT decide a dónde ir
@Component({
  selector: 'ye-login',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink, Button, Card, Icon, TextField, TextFieldInput, Yoyo],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);

  protected readonly form = inject(NonNullableFormBuilder).group({
    username: ['', Validators.required],
    password: ['', Validators.required],
  });

  // Enlace a las cuentas de prueba: solo fuera del piloto
  protected readonly testAccounts = environment.testAccounts;

  protected readonly submitted = signal(false);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);

  protected fieldError(name: 'username' | 'password'): string | null {
    if (!this.submitted() || !this.form.controls[name].hasError('required')) return null;
    return name === 'username' ? 'Escribe tu usuario.' : 'Escribe tu contraseña.';
  }

  protected submit(): void {
    if (this.loading()) return;
    this.submitted.set(true);
    this.error.set(null);
    if (this.form.invalid) {
      // Lleva el foco al primer campo con error para que se anuncie el mensaje
      afterNextRender(
        () => this.host.nativeElement.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus(),
        { injector: this.injector },
      );
      return;
    }

    this.loading.set(true);
    this.auth.login(this.form.getRawValue()).subscribe({
      next: () => void this.router.navigateByUrl(ROLE_HOME[this.auth.role()!]),
      error: (err: unknown) => {
        this.loading.set(false);
        this.form.controls.password.reset();
        this.submitted.set(false);
        this.error.set(
          err instanceof HttpErrorResponse && err.status === 401
            ? 'Ups, no pudimos entrar. Revisa tu usuario y tu contraseña.'
            : 'No pudimos conectarnos. Intenta otra vez en un momento.',
        );
      },
    });
  }
}
