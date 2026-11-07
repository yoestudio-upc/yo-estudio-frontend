import { HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, mergeMap, of, throwError, timer } from 'rxjs';
import { AuthApi, LoginRequest, LoginResponse, SessionUser } from '../auth.api';
import { SessionStore } from '../../auth/session-store';
import { MOCK_LATENCY_MS } from './mock-latency';

// Contraseña común de los usuarios de prueba
export const MOCK_PASSWORD = 'yoyo123';

const MOCK_USERS: Record<string, SessionUser> = {
  'rosa.diaz': { id: 't-1', name: 'Rosa Díaz', role: 'docente' },
  'camila.rojas': { id: 's-1', name: 'Camila Rojas', role: 'estudiante', grade: 4, section: 'B' },
  'mateo.quispe': { id: 's-2', name: 'Mateo Quispe', role: 'estudiante', grade: 4, section: 'B' },
};

const TOKEN_TTL_SECONDS = 8 * 60 * 60;

@Injectable()
export class AuthMockApi extends AuthApi {
  // Sin dependencias: se instancia directo (los tests crean el mock con new)
  private readonly store = new SessionStore();

  // Como el backend: renueva la sesión guardada; sin sesión responde 401
  refresh(): Observable<LoginResponse> {
    const user = this.store.read()?.user;
    if (!user) {
      return timer(MOCK_LATENCY_MS).pipe(
        mergeMap(() => throwError(() => new HttpErrorResponse({ status: 401, url: '/auth/refresh' }))),
      );
    }
    return timer(MOCK_LATENCY_MS).pipe(mergeMap(() => of({ accessToken: createUnsignedToken(user), user })));
  }

  login({ username, password }: LoginRequest): Observable<LoginResponse> {
    const user = MOCK_USERS[username.trim().toLowerCase()];
    if (!user || password !== MOCK_PASSWORD) {
      return timer(MOCK_LATENCY_MS).pipe(
        mergeMap(() =>
          throwError(
            () =>
              new HttpErrorResponse({
                status: 401,
                statusText: 'Unauthorized',
                url: '/auth/login',
              }),
          ),
        ),
      );
    }
    return timer(MOCK_LATENCY_MS).pipe(
      mergeMap(() => of({ accessToken: createUnsignedToken(user), user })),
    );
  }
}

// JWT sin firma con la misma forma que emitirá el backend (sub, role, exp)
function createUnsignedToken(user: SessionUser): string {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'none', typ: 'JWT' };
  const payload = { sub: user.id, role: user.role, iat: now, exp: now + TOKEN_TTL_SECONDS };
  return `${base64UrlEncode(header)}.${base64UrlEncode(payload)}.mock`;
}

function base64UrlEncode(value: object): string {
  const bytes = new TextEncoder().encode(JSON.stringify(value));
  const binary = Array.from(bytes, (b) => String.fromCharCode(b)).join('');
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
