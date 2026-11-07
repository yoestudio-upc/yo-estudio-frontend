import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of, throwError } from 'rxjs';
import { AuthApi, LoginResponse } from '../api/auth.api';
import { AuthService } from './auth.service';
import { SessionStore } from './session-store';
import { fakeToken } from './testing';

describe('AuthService', () => {
  let response: LoginResponse;

  let refresh: ReturnType<typeof vi.fn>;

  function setup(): AuthService {
    refresh = vi.fn(() =>
      of({ accessToken: fakeToken('estudiante', 3600), user: response.user } as LoginResponse),
    );
    TestBed.configureTestingModule({
      providers: [{ provide: AuthApi, useValue: { login: () => of(response), refresh } }],
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

  describe('sesión deslizante', () => {
    async function signedIn(expInSeconds: number) {
      response.accessToken = fakeToken('estudiante', expInSeconds);
      const auth = setup();
      await firstValueFrom(auth.login({ username: 'x', password: 'x' }));
      return auth;
    }

    it('renueva si vence pronto y hubo actividad reciente', async () => {
      const auth = await signedIn(5 * 60);
      const before = auth.token();
      auth.markActiveAt(Date.now() - 60 * 1000);
      expect(await auth.refreshIfActive()).toBe(true);
      expect(refresh).toHaveBeenCalledTimes(1);
      expect(auth.token()).not.toBe(before);
      expect(TestBed.inject(SessionStore).read()?.accessToken).toBe(auth.token());
    });

    it('no renueva si todavía falta mucho para que venza', async () => {
      const auth = await signedIn(30 * 60);
      expect(await auth.refreshIfActive()).toBe(false);
      expect(refresh).not.toHaveBeenCalled();
    });

    it('no renueva si la persona dejó de usar la plataforma', async () => {
      const auth = await signedIn(5 * 60);
      auth.markActiveAt(Date.now() - 20 * 60 * 1000);
      expect(await auth.refreshIfActive()).toBe(false);
      expect(refresh).not.toHaveBeenCalled();
    });

    it('no revive un token vencido', async () => {
      const auth = await signedIn(5 * 60);
      expect(await auth.refreshIfActive(Date.now() + 6 * 60 * 1000)).toBe(false);
      expect(refresh).not.toHaveBeenCalled();
    });

    it('si la renovación falla, la sesión sigue igual', async () => {
      const auth = await signedIn(5 * 60);
      const before = auth.token();
      refresh.mockReturnValue(throwError(() => new Error('sin conexión')));
      expect(await auth.refreshIfActive()).toBe(false);
      expect(auth.token()).toBe(before);
      expect(auth.isAuthenticated()).toBe(true);
    });
  });
});
