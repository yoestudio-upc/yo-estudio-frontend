import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_URL } from '../api-url';
import { TestAccount } from '../test-accounts.api';
import { TestAccountsHttpApi } from './test-accounts.http';

describe('TestAccountsHttpApi', () => {
  let api: TestAccountsHttpApi;
  let backend: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        TestAccountsHttpApi,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_URL, useValue: '/api' },
      ],
    });
    api = TestBed.inject(TestAccountsHttpApi);
    backend = TestBed.inject(HttpTestingController);
  });

  afterEach(() => backend.verify());

  it('pregunta si el backend permite crear cuentas de prueba', () => {
    let enabled: boolean | undefined;
    api.enabled().subscribe((e) => (enabled = e));
    backend.expectOne('/api/auth/test-accounts').flush({ enabled: true });
    expect(enabled).toBe(true);
  });

  it('crea la cuenta con su rol y devuelve el id como texto', () => {
    let created: TestAccount | undefined;
    const request = {
      username: 'rosa.d',
      firstName: 'Rosa',
      lastName: 'Díaz',
      password: 'clave1',
      role: 'docente' as const,
    };
    api.create(request).subscribe((a) => (created = a));
    const req = backend.expectOne('/api/auth/test-accounts');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(request);
    req.flush({ id: 7, username: 'rosa.d', name: 'Rosa Díaz', role: 'docente' }, { status: 201, statusText: 'Created' });
    expect(created).toEqual({ id: '7', username: 'rosa.d', name: 'Rosa Díaz', role: 'docente' });
  });
});
