import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { API_URL } from '../api/api-url';
import { AuthApi } from '../api/auth.api';
import { Role } from '../models/user';
import { authInterceptor, isApiRequest } from './auth.interceptor';
import { AuthService } from './auth.service';
import { errorInterceptor } from './error.interceptor';
import { SessionStore } from './session-store';
import { fakeToken } from './testing';

describe('interceptores', () => {
  let http: HttpClient;
  let backend: HttpTestingController;
  let navigate: ReturnType<typeof vi.fn>;
  let token: string;

  function setup(role: Role | null) {
    sessionStorage.clear();
    token = role ? fakeToken(role) : '';
    if (role) new SessionStore().write({ accessToken: token, user: { id: 'u', name: 'P', role } });
    navigate = vi.fn().mockResolvedValue(true);
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor, errorInterceptor])),
        provideHttpClientTesting(),
        { provide: API_URL, useValue: '/api' },
        { provide: AuthApi, useValue: {} },
        { provide: Router, useValue: { navigateByUrl: navigate } },
      ],
    });
    http = TestBed.inject(HttpClient);
    backend = TestBed.inject(HttpTestingController);
  }

  // Hace la petición y responde con el estado indicado; devuelve el estado recibido
  function request(url: string, status = 200): number {
    let received = 0;
    http.get(url).subscribe({ next: () => (received = 200), error: (e) => (received = e.status) });
    backend.expectOne(url).flush(null, { status, statusText: String(status) });
    return received;
  }

  afterEach(() => backend?.verify());

  it('isApiRequest reconoce solo las URL de la API', () => {
    expect(isApiRequest('/api/me/courses', '/api')).toBe(true);
    expect(isApiRequest('https://fonts.googleapis.com/css2', '/api')).toBe(false);
    expect(isApiRequest('/api/me/courses', '')).toBe(false);
  });

  describe('authInterceptor', () => {
    it('agrega el JWT a las peticiones de la API', () => {
      setup('estudiante');
      http.get('/api/me/courses').subscribe();
      const req = backend.expectOne('/api/me/courses');
      expect(req.request.headers.get('Authorization')).toBe(`Bearer ${token}`);
      req.flush([]);
    });

    it('no envía el token a otros dominios', () => {
      setup('estudiante');
      http.get('https://fonts.googleapis.com/css2').subscribe();
      const req = backend.expectOne('https://fonts.googleapis.com/css2');
      expect(req.request.headers.has('Authorization')).toBe(false);
      req.flush({});
    });

    it('sin sesión no agrega nada', () => {
      setup(null);
      http.post('/api/auth/sign-in', {}).subscribe();
      const req = backend.expectOne('/api/auth/sign-in');
      expect(req.request.headers.has('Authorization')).toBe(false);
      req.flush({});
    });
  });

  describe('errorInterceptor', () => {
    it('401 de la API: cierra la sesión y va a /ingreso', () => {
      setup('estudiante');
      expect(request('/api/me/goals', 401)).toBe(401);
      expect(TestBed.inject(AuthService).isAuthenticated()).toBe(false);
      expect(navigate).toHaveBeenCalledWith('/ingreso');
    });

    it('401 del login: lo deja a la pantalla de ingreso', () => {
      setup(null);
      let status = 0;
      http.post('/api/auth/sign-in', {}).subscribe({ error: (e) => (status = e.status) });
      backend.expectOne('/api/auth/sign-in').flush(null, { status: 401, statusText: '401' });
      expect(status).toBe(401);
      expect(navigate).not.toHaveBeenCalled();
    });

    it('403: vuelve al inicio del rol sin cerrar la sesión', () => {
      setup('docente');
      expect(request('/api/teacher/courses', 403)).toBe(403);
      expect(TestBed.inject(AuthService).isAuthenticated()).toBe(true);
      expect(navigate).toHaveBeenCalledWith('/docente/cursos');
    });

    it('errores de otros dominios no tocan la sesión', () => {
      setup('estudiante');
      expect(request('https://externo.test/x', 401)).toBe(401);
      expect(TestBed.inject(AuthService).isAuthenticated()).toBe(true);
      expect(navigate).not.toHaveBeenCalled();
    });
  });
});
