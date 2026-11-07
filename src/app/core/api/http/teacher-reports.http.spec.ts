import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { EvaluationReport } from '../../models/dto/teacher.dto';
import { API_URL } from '../api-url';
import { TeacherReportsHttpApi } from './teacher-reports.http';

describe('TeacherReportsHttpApi', () => {
  let api: TeacherReportsHttpApi;
  let backend: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        TeacherReportsHttpApi,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_URL, useValue: '/api' },
      ],
    });
    api = TestBed.inject(TeacherReportsHttpApi);
    backend = TestBed.inject(HttpTestingController);
  });

  afterEach(() => backend.verify());

  it('trae los resultados por alumno con riesgo y SHAP, con ids como texto', () => {
    let result: EvaluationReport | undefined;
    api.getResults('7').subscribe((r) => (result = r));
    backend.expectOne('/api/teachers/me/evaluations/7/results').flush({
      evaluation: {
        id: 7,
        name: 'Fracciones 2',
        status: 'published',
        startDate: '2026-11-07',
        endDate: '2026-11-14',
        topic: { id: 2, code: 'fracciones', name: 'Fracciones' },
        questionCount: 4,
      },
      course: { id: 3, name: 'Matemática', grade: 4, section: 'B' },
      students: [
        {
          studentId: 11,
          name: 'Ana Ruiz',
          done: true,
          correctCount: 1,
          topicLevel: 1,
          subtopics: [{ id: 5, code: 'comparar-fracciones', name: 'Comparar fracciones', level: 1 }],
          prediction: { level: 1, risk: 'high' },
          factors: [{ label: 'Aciertos en Fracciones (25 %)', weight: -0.23 }],
          profile: { name: 'Paso a paso', note: 'Se toma su tiempo y revisa antes de responder.' },
          goals: [],
        },
        {
          studentId: 12,
          name: 'Beto Ruiz',
          done: false,
          correctCount: null,
          topicLevel: null,
          subtopics: [{ id: 5, code: 'comparar-fracciones', name: 'Comparar fracciones', level: null }],
          prediction: null,
          factors: [],
          profile: null,
          goals: [],
        },
      ],
    });
    expect(result?.evaluation.id).toBe('7');
    expect(result?.evaluation.topic).toEqual({ id: '2', code: 'fracciones', name: 'Fracciones' });
    expect(result?.course.id).toBe('3');
    expect(result?.students.map((s) => s.studentId)).toEqual(['11', '12']);
    expect(result?.students[0].subtopics).toEqual([
      { id: '5', code: 'comparar-fracciones', name: 'Comparar fracciones', level: 1 },
    ]);
    expect(result?.students[0].prediction).toEqual({ level: 1, risk: 'high' });
    expect(result?.students[0].factors[0].weight).toBe(-0.23);
    expect(result?.students[1].prediction).toBeNull();
  });
});
