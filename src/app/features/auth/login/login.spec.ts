import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { Observable, of, throwError } from 'rxjs';
import { AuthApi, LoginResponse } from '../../../core/api/auth.api';
import { fakeToken } from '../../../core/auth/testing';
import { Login } from './login';

describe('Login', () => {
  let loginResult: () => Observable<LoginResponse>;
  let navigate: ReturnType<typeof vi.fn>;

  async function render() {
    sessionStorage.clear();
    navigate = vi.fn().mockResolvedValue(true);
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthApi, useValue: { login: () => loginResult() } },
        { provide: Router, useValue: { navigateByUrl: navigate } },
      ],
    });
    const fixture = TestBed.createComponent(Login);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;

    const fill = (username: string, password: string) => {
      for (const [name, value] of [
        ['username', username],
        ['password', password],
      ]) {
        const input = el.querySelector<HTMLInputElement>(`input[formcontrolname="${name}"]`)!;
        input.value = value;
        input.dispatchEvent(new Event('input'));
      }
    };
    const submit = async () => {
      el.querySelector<HTMLButtonElement>('button[type="submit"]')!.click();
      await fixture.whenStable();
    };
    return { el, fill, submit };
  }

  it('con datos vacíos muestra qué falta y no llama a la API', async () => {
    loginResult = vi.fn();
    const { el, submit } = await render();
    await submit();

    expect(el.textContent).toContain('Escribe tu usuario.');
    expect(el.textContent).toContain('Escribe tu contraseña.');
    expect(loginResult).not.toHaveBeenCalled();
  });

  it('el docente va a sus cursos', async () => {
    loginResult = () =>
      of({ accessToken: fakeToken('docente'), user: { id: 't', name: 'R', role: 'docente' } });
    const { fill, submit } = await render();
    fill('rosa.diaz', 'x');
    await submit();
    expect(navigate).toHaveBeenCalledWith('/docente/cursos');
  });

  it('el estudiante va a sus cursos', async () => {
    loginResult = () =>
      of({
        accessToken: fakeToken('estudiante'),
        user: { id: 's', name: 'C', role: 'estudiante' },
      });
    const { fill, submit } = await render();
    fill('camila.rojas', 'x');
    await submit();
    expect(navigate).toHaveBeenCalledWith('/estudiante/cursos');
  });

  it('con datos incorrectos muestra un aviso amable y borra la contraseña', async () => {
    loginResult = () => throwError(() => new HttpErrorResponse({ status: 401 }));
    const { el, fill, submit } = await render();
    fill('camila.rojas', 'mala');
    await submit();

    const alert = el.querySelector('[role="alert"]');
    expect(alert?.textContent).toContain('Revisa tu usuario y tu contraseña');
    expect(el.querySelector<HTMLInputElement>('input[type="password"]')!.value).toBe('');
    expect(el.querySelector<HTMLInputElement>('input[autocomplete="username"]')!.value).toBe(
      'camila.rojas',
    );
    expect(navigate).not.toHaveBeenCalled();
  });

  it('si falla la conexión lo dice distinto', async () => {
    loginResult = () => throwError(() => new HttpErrorResponse({ status: 0 }));
    const { el, fill, submit } = await render();
    fill('camila.rojas', 'x');
    await submit();
    expect(el.querySelector('[role="alert"]')?.textContent).toContain('No pudimos conectarnos');
  });
});
