import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { TeacherClassDetail, TeacherClassSummary } from '../../models/dto/teacher.dto';
import { API_URL } from '../api-url';
import { TeacherClassHttpApi } from './teacher-class.http';

const BACKEND_COURSE = {
  id: 3,
  name: 'Matemática',
  subject: 'matematica',
  grade: 4,
  section: 'B',
  joinCode: 'K7P2QX',
  topics: [{ id: 8, code: 'fracciones', name: 'Fracciones' }],
  studentCount: 2,
};

const SUMMARY: TeacherClassSummary = {
  id: '3',
  name: 'Matemática',
  subject: 'matematica',
  grade: 4,
  section: 'B',
  joinCode: 'K7P2QX',
  topics: [{ id: '8', code: 'fracciones', name: 'Fracciones' }],
  studentCount: 2,
};

describe('TeacherClassHttpApi', () => {
  let api: TeacherClassHttpApi;
  let backend: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        TeacherClassHttpApi,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_URL, useValue: '/api' },
      ],
    });
    api = TestBed.inject(TeacherClassHttpApi);
    backend = TestBed.inject(HttpTestingController);
  });

  afterEach(() => backend.verify());

  it('lista los cursos del docente con ids como texto', () => {
    let result: TeacherClassSummary[] = [];
    api.getMyClasses().subscribe((r) => (result = r));
    backend.expectOne('/api/teachers/me/courses').flush([BACKEND_COURSE]);
    expect(result).toEqual([SUMMARY]);
  });

  it('trae el detalle con sus estudiantes', () => {
    let result: TeacherClassDetail | undefined;
    api.getClass('3').subscribe((r) => (result = r));
    backend
      .expectOne('/api/teachers/me/courses/3')
      .flush({ ...BACKEND_COURSE, students: [{ id: 5, name: 'Ana Perez' }] });
    expect(result).toEqual({ ...SUMMARY, students: [{ id: '5', name: 'Ana Perez' }] });
  });

  it('crea el curso con POST /courses', () => {
    let result: TeacherClassSummary | undefined;
    api.create({ subject: 'matematica', grade: 4, section: 'B' }).subscribe((r) => (result = r));
    const req = backend.expectOne('/api/courses');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ subject: 'matematica', grade: 4, section: 'B' });
    req.flush(BACKEND_COURSE);
    expect(result).toEqual(SUMMARY);
  });
});
