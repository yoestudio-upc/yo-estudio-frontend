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

  it('arma el resumen con el curso y sus evaluaciones pendientes y hechas', () => {
    let result: StudentClassOverview | undefined;
    api.getOverview('3').subscribe((r) => (result = r));
    const evaluation = (id: number, done: boolean) => ({
      id,
      name: `Fracciones ${id}`,
      startDate: '2026-11-07',
      endDate: '2026-11-14',
      topic: { id: 4, code: 'fracciones', name: 'Fracciones' },
      subtopics: [{ id: 5, code: 'comparar-fracciones', name: 'Comparar fracciones' }],
      questionCount: 2,
      inProgress: !done,
      done,
    });
    backend.expectOne('/api/students/me/courses/3').flush({ ...BACKEND_COURSE, pendingCount: 1 });
    backend.expectOne('/api/students/me/courses/3/evaluations').flush({
      pending: [evaluation(8, false)],
      done: [evaluation(7, true)],
      lastEvaluationName: 'Fracciones 7',
      achievedCount: 2,
    });
    expect(result?.course).toEqual({ ...SUMMARY, pendingCount: 1 });
    expect(result?.pending).toEqual([
      {
        id: '8',
        name: 'Fracciones 8',
        startDate: '2026-11-07',
        endDate: '2026-11-14',
        topic: { id: '4', code: 'fracciones', name: 'Fracciones' },
        subtopics: [{ id: '5', code: 'comparar-fracciones', name: 'Comparar fracciones' }],
        questionCount: 2,
        inProgress: true,
        done: false,
      },
    ]);
    expect(result?.done.map((e) => e.id)).toEqual(['7']);
    expect(result?.lastEvaluationName).toBe('Fracciones 7');
    expect(result?.achievedCount).toBe(2);
    expect(result?.nextGoal).toBeNull();
  });
});
