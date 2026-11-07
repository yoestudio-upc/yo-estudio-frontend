import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { StudentClassOverview, StudentClassSummary } from '../../models/dto/student.dto';
import { API_URL } from '../api-url';
import { StudentClassHttpApi } from './student-class.http';

const BACKEND_COURSE = {
  id: 3,
  name: 'Matemática',
  subject: 'matematica',
  grade: 4,
  section: 'B',
  teacherName: 'Rosa Diaz',
  topics: [],
  pendingCount: 0,
};

const SUMMARY: StudentClassSummary = {
  id: '3',
  name: 'Matemática',
  subject: 'matematica',
  grade: 4,
  section: 'B',
  teacherName: 'Rosa Diaz',
  topics: [],
  pendingCount: 0,
};

describe('StudentClassHttpApi', () => {
  let api: StudentClassHttpApi;
  let backend: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        StudentClassHttpApi,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_URL, useValue: '/api' },
      ],
    });
    api = TestBed.inject(StudentClassHttpApi);
    backend = TestBed.inject(HttpTestingController);
  });

  afterEach(() => backend.verify());

  it('lista los cursos del estudiante', () => {
    let result: StudentClassSummary[] = [];
    api.getMyClasses().subscribe((r) => (result = r));
    backend.expectOne('/api/students/me/courses').flush([BACKEND_COURSE]);
    expect(result).toEqual([SUMMARY]);
  });

  it('se une con el código y devuelve el curso', () => {
    let result: StudentClassSummary | undefined;
    api.join('K7P2QX').subscribe((r) => (result = r));
    const req = backend.expectOne('/api/students/me/courses/join');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ code: 'K7P2QX' });
    req.flush(BACKEND_COURSE);
    expect(result).toEqual(SUMMARY);
  });

  it('deja pasar 404 y 409 para que la pantalla muestre el mensaje', () => {
    const statuses: number[] = [];
    for (const status of [404, 409]) {
      api.join('X').subscribe({ error: (e) => statuses.push(e.status) });
      backend.expectOne('/api/students/me/courses/join').flush(null, { status, statusText: '' });
    }
    expect(statuses).toEqual([404, 409]);
  });

  it('arma el resumen del curso sin evaluaciones todavía', () => {
    let result: StudentClassOverview | undefined;
    api.getOverview('3').subscribe((r) => (result = r));
    backend.expectOne('/api/students/me/courses/3').flush(BACKEND_COURSE);
    expect(result).toEqual({
      course: SUMMARY,
      pending: [],
      done: [],
      nextGoal: null,
      achievedCount: 0,
      lastEvaluationName: null,
    });
  });
});
