import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Observable, of, throwError } from 'rxjs';
import { TestAccount, TestAccountRequest, TestAccountsApi } from '../../../core/api/test-accounts.api';
import { TestAccounts } from './test-accounts';

describe('TestAccounts (cuentas de prueba)', () => {
  let create: ReturnType<typeof vi.fn>;

  async function render(options: {
    enabled?: () => Observable<boolean>;
    create?: (r: TestAccountRequest) => Observable<TestAccount>;
  } = {}) {
    create = vi.fn(
      options.create ??
        ((r: TestAccountRequest) =>
          of({ id: '9', username: r.username, name: `${r.firstName} ${r.lastName}`, role: r.role })),
    );
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {
          provide: TestAccountsApi,
          useValue: { enabled: options.enabled ?? (() => of(true)), create },
        },
      ],
    });
    const fixture = TestBed.createComponent(TestAccounts);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    const settle = async () => {
      await fixture.whenStable();
      await new Promise((r) => setTimeout(r));
      await fixture.whenStable();
    };
    const type = (name: string, value: string) => {
      const input = el.querySelector<HTMLInputElement>(`input[formcontrolname="${name}"]`)!;
      input.value = value;
      input.dispatchEvent(new Event('input'));
    };
    const fill = (values: Record<string, string>) => {
      for (const [name, value] of Object.entries(values)) type(name, value);
    };
    const chooseRole = (role: 'docente' | 'estudiante') => {
      el.querySelector<HTMLInputElement>(`input[value="${role}"]`)!.click();
    };
    const submit = async () => {
      el.querySelector<HTMLButtonElement>('button[type="submit"]')!.click();
      await settle();
    };
    return { el, fill, chooseRole, submit, settle };
  }

  const VALID = { firstName: 'Rosa', lastName: 'Díaz', username: 'rosa.d', password: 'clave1' };

  it('avisa que es solo para pruebas', async () => {
    const { el } = await render();
    expect(el.textContent).toContain('Solo para pruebas');
  });

  it('con datos vacíos dice qué falta y no crea nada', async () => {
    const { el, submit } = await render();
    await submit();
    for (const message of ['Escribe el nombre.', 'Escribe el apellido.', 'Escribe el usuario.', 'Escribe una contraseña.']) {
      expect(el.textContent).toContain(message);
    }
    expect(create).not.toHaveBeenCalled();
  });

  it('crea un docente con el usuario en minúsculas y sin espacios', async () => {
    const { el, fill, chooseRole, submit } = await render();
    chooseRole('docente');
    fill({ ...VALID, username: '  Rosa.D ' });
    await submit();
    expect(create).toHaveBeenCalledWith({
      role: 'docente',
      firstName: 'Rosa',
      lastName: 'Díaz',
      username: 'rosa.d',
      password: 'clave1',
    });
    expect(el.querySelector('[role="status"]')?.textContent).toContain('Creaste la cuenta de docente «rosa.d»');
    expect(el.querySelector('.created')?.textContent).toContain('rosa.d');
    // Queda lista para crear otra del mismo rol
    expect(el.querySelector<HTMLInputElement>('input[formcontrolname="username"]')!.value).toBe('');
    expect(el.querySelector<HTMLInputElement>('input[value="docente"]')!.checked).toBe(true);
  });

  it('por defecto crea estudiantes', async () => {
    const { fill, submit } = await render();
    fill(VALID);
    await submit();
    expect(create.mock.lastCall?.[0].role).toBe('estudiante');
  });

  it('rechaza usuarios con espacios o tildes antes de llamar a la API', async () => {
    const { el, fill, submit } = await render();
    fill({ ...VALID, username: 'rosá d' });
    await submit();
    expect(el.textContent).toContain('Usa solo letras sin tildes');
    expect(create).not.toHaveBeenCalled();
  });

  it('pide al menos 4 caracteres de contraseña', async () => {
    const { el, fill, submit } = await render();
    fill({ ...VALID, password: 'abc' });
    await submit();
    expect(el.textContent).toContain('Usa al menos 4 caracteres.');
  });

  it('si el usuario ya existe lo dice', async () => {
    const { el, fill, submit } = await render({
      create: () => throwError(() => new HttpErrorResponse({ status: 400 })),
    });
    fill(VALID);
    await submit();
    expect(el.querySelector('[role="alert"]')?.textContent).toContain('Ya existe una cuenta con el usuario «rosa.d»');
  });

  it('si el backend la tiene apagada, no muestra el formulario', async () => {
    const { el } = await render({ enabled: () => of(false) });
    expect(el.querySelector('form')).toBeNull();
    expect(el.textContent).toContain('está apagada en este servidor');
  });
});
