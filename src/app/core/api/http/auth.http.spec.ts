import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_URL } from '../api-url';
import { LoginResponse } from '../auth.api';
import { AuthHttpApi } from './auth.http';

describe('AuthHttpApi', () => {
  let api: AuthHttpApi;
  let backend: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        AuthHttpApi,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_URL, useValue: '/api' },
      ],
    });
    api = TestBed.inject(AuthHttpApi);
    backend = TestBed.inject(HttpTestingController);
  });

  afterEach(() => backend.verify());

  it('envía usuario y contraseña a /auth/sign-in y adapta la respuesta', () => {
    let response: LoginResponse | undefined;
    api.login({ username: 'ana01', password: 'secreto' }).subscribe((r) => (response = r));

    const req = backend.expectOne('/api/auth/sign-in');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ username: 'ana01', password: 'secreto' });
    req.flush({
      access_token: 'a.b.c',
      token_type: 'bearer',
      user: { id: 7, name: 'Ana Perez', role: 'estudiante' },
    });

    expect(response).toEqual({
      accessToken: 'a.b.c',
      user: { id: '7', name: 'Ana Perez', role: 'estudiante' },
    });
  });

  it('deja pasar el 401 para que lo maneje la pantalla de ingreso', () => {
    let status = 0;
    api.login({ username: 'ana01', password: 'mala' }).subscribe({ error: (e) => (status = e.status) });
    backend.expectOne('/api/auth/sign-in').flush(null, { status: 401, statusText: 'Unauthorized' });
    expect(status).toBe(401);
  });
});
