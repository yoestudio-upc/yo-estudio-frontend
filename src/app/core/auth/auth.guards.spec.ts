import { TestBed } from '@angular/core/testing';
import { Route, Router, UrlTree } from '@angular/router';
import { AuthApi } from '../api/auth.api';
import { Role } from '../models/user';
import { guestGuard, redirectToHome, roleGuard } from './auth.guards';
import { SessionStore } from './session-store';
import { fakeToken } from './testing';

describe('guards de autenticación', () => {
  function setup(role?: Role, expInSeconds = 3600) {
    sessionStorage.clear();
    if (role) {
      new SessionStore().write({
        accessToken: fakeToken(role, expInSeconds),
        user: { id: 'u-1', name: 'Prueba', role },
      });
    }
    TestBed.configureTestingModule({ providers: [{ provide: AuthApi, useValue: {} }] });
  }

  const urlOf = (result: unknown) => TestBed.inject(Router).serializeUrl(result as UrlTree);
  const runRole = (role: Role) =>
    TestBed.runInInjectionContext(() => roleGuard(role)({} as Route, [], {} as never));
  const runGuest = () => TestBed.runInInjectionContext(() => guestGuard({} as never, {} as never));
  const runHome = () => TestBed.runInInjectionContext(() => redirectToHome({} as never));

  describe('roleGuard', () => {
    it('sin sesión manda a /ingreso', () => {
      setup();
      expect(urlOf(runRole('estudiante'))).toBe('/ingreso');
    });

    it('con el token vencido manda a /ingreso', () => {
      setup('estudiante', -10);
      expect(urlOf(runRole('estudiante'))).toBe('/ingreso');
    });

    it('deja pasar al rol correcto', () => {
      setup('estudiante');
      expect(runRole('estudiante')).toBe(true);
    });

    it('al otro rol lo manda a su propio inicio', () => {
      setup('docente');
      expect(urlOf(runRole('estudiante'))).toBe('/docente/cursos');
    });
  });

  describe('guestGuard', () => {
    it('sin sesión muestra el ingreso', () => {
      setup();
      expect(runGuest()).toBe(true);
    });

    it('con sesión manda al inicio del rol', () => {
      setup('estudiante');
      expect(urlOf(runGuest())).toBe('/estudiante/cursos');
    });
  });

  describe('redirectToHome', () => {
    it('elige el destino según la sesión', () => {
      setup();
      expect(runHome()).toBe('/ingreso');
    });

    it('con sesión de docente va a sus cursos', () => {
      setup('docente');
      expect(runHome()).toBe('/docente/cursos');
    });
  });
});
