import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Goal, StudentProgress } from '../../models/dto/student.dto';
import { API_URL } from '../api-url';
import { StudentProgressHttpApi } from './student-progress.http';

describe('StudentProgressHttpApi', () => {
  let api: StudentProgressHttpApi;
  let backend: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        StudentProgressHttpApi,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_URL, useValue: '/api' },
      ],
    });
    api = TestBed.inject(StudentProgressHttpApi);
    backend = TestBed.inject(HttpTestingController);
  });

  afterEach(() => backend.verify());

  it('trae las metas priorizadas con ids como texto', () => {
    let result: Goal[] = [];
    api.getGoals().subscribe((r) => (result = r));
    backend.expectOne('/api/students/me/goals').flush([
      {
        priority: 1,
        classId: 3,
        topic: { id: 7, code: 'geometria', name: 'Geometría' },
        subtopic: { id: 8, code: 'perimetro', name: 'Perímetro' },
        level: 1,
        practice: { kind: 'concrete', text: 'Problemas con dibujos.' },
      },
    ]);
    expect(result).toEqual([
      {
        priority: 1,
        classId: '3',
        topic: { id: '7', code: 'geometria', name: 'Geometría' },
        subtopic: { id: '8', code: 'perimetro', name: 'Perímetro' },
        level: 1,
        practice: { kind: 'concrete', text: 'Problemas con dibujos.' },
      },
    ]);
  });

  it('trae Mi avance del curso con subtemas sin evaluar y el perfil', () => {
    let result: StudentProgress | undefined;
    api.getProgress('3').subscribe((r) => (result = r));
    const profile = { code: 'explorer', name: 'Con muchas ideas', description: 'Pruebas varias opciones.' };
    backend.expectOne('/api/students/me/courses/3/progress').flush({
      classId: 3,
      topics: [
        {
          topic: { id: 2, code: 'fracciones', name: 'Fracciones' },
          subtopics: [
            { id: 3, code: 'fracciones-equivalentes', name: 'Fracciones equivalentes', level: 3 },
            { id: 4, code: 'sumar-fracciones', name: 'Sumar fracciones', level: null },
          ],
          achieved: 1,
        },
      ],
      profile,
    });
    expect(result).toEqual({
      classId: '3',
      topics: [
        {
          topic: { id: '2', code: 'fracciones', name: 'Fracciones' },
          subtopics: [
            { id: '3', code: 'fracciones-equivalentes', name: 'Fracciones equivalentes', level: 3 },
            { id: '4', code: 'sumar-fracciones', name: 'Sumar fracciones', level: null },
          ],
          achieved: 1,
        },
      ],
      profile,
    });
  });
});
