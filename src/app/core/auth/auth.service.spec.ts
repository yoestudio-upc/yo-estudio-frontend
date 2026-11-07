import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of } from 'rxjs';
import { AuthApi, LoginResponse } from '../api/auth.api';
import { AuthService } from './auth.service';
import { SessionStore } from './session-store';
import { fakeToken } from './testing';

describe('AuthService', () => {
  let response: LoginResponse;

  function setup(): AuthService {
    TestBed.configureTestingModule({
      providers: [{ provide: AuthApi, useValue: { login: () => of(response) } }],
    });
    return TestBed.inject(AuthService);
  }

  beforeEach(() => {
    sessionStorage.clear();
    response = {
      accessToken: fakeToken('estudiante'),
      user: { id: 's-1', name: 'Camila Rojas', role: 'estudiante', grade: 4, section: 'B' },
    };
  });

  it('al ingresar guarda la sesión y expone usuario y rol', async () => {
    const auth = setup();
    await firstValueFrom(auth.login({ username: 'camila.rojas', password: 'x' }));

    expect(auth.isAuthenticated()).toBe(true);
    expect(auth.role()).toBe('estudiante');
    expect(auth.user()?.name).toBe('Camila Rojas');
    expect(TestBed.inject(SessionStore).read()?.accessToken).toBe(response.accessToken);
  });

  it('toma el rol del JWT y no de los datos del usuario', async () => {
    response.accessToken = fakeToken('docente');
    const auth = setup();
    await firstValueFrom(auth.login({ username: 'x', password: 'x' }));
    expect(auth.role()).toBe('docente');
  });

  it('rechaza un token que no se puede leer', async () => {
    response.accessToken = 'basura';
    const auth = setup();
    await expect(firstValueFrom(auth.login({ username: 'x', password: 'x' }))).rejects.toThrow();
    expect(auth.isAuthenticated()).toBe(false);
  });

  it('restaura la sesión guardada si no venció', () => {
    new SessionStore().write({ accessToken: fakeToken('docente'), user: response.user });
    expect(setup().role()).toBe('docente');
  });

  it('descarta la sesión guardada si el token venció', () => {
    const store = new SessionStore();
    store.write({ accessToken: fakeToken('docente', -10), user: response.user });
    const auth = setup();
    expect(auth.isAuthenticated()).toBe(false);
    expect(store.read()).toBeNull();
  });

  it('al salir limpia la sesión', async () => {
    const auth = setup();
    await firstValueFrom(auth.login({ username: 'x', password: 'x' }));
    auth.logout();
    expect(auth.isAuthenticated()).toBe(false);
    expect(auth.token()).toBeNull();
    expect(TestBed.inject(SessionStore).read()).toBeNull();
  });
});
