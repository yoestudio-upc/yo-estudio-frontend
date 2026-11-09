import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { EvaluationResult, TakeEvaluation, TakeProgress } from '../../models/dto/student.dto';
import { API_URL } from '../api-url';
import { StudentEvaluationHttpApi } from './student-evaluation.http';

const PROGRESS: TakeProgress = {
  answers: { '11': '21' },
  choices: {},
  texts: {},
  skipped: ['12'],
  currentIndex: 1,
};
const BACKEND_PROGRESS = { answers: { '11': 21 }, choices: {}, texts: {}, skipped: [12], currentIndex: 1 };

const BACKEND_RESULT = {
  evaluationId: 7,
  classId: 3,
  name: 'Fracciones 1',
  topic: { id: 4, code: 'fracciones', name: 'Fracciones' },
  totalCount: 2,
  answeredCount: 2,
  correctCount: 1,
  subtopics: [],
};

const RESULT: EvaluationResult = {
  evaluationId: '7',
  classId: '3',
  name: 'Fracciones 1',
  topic: { id: '4', code: 'fracciones', name: 'Fracciones' },
  totalCount: 2,
  answeredCount: 2,
  correctCount: 1,
  subtopics: [],
};

describe('StudentEvaluationHttpApi', () => {
  let api: StudentEvaluationHttpApi;
  let backend: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        StudentEvaluationHttpApi,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_URL, useValue: '/api' },
      ],
    });
    api = TestBed.inject(StudentEvaluationHttpApi);
    backend = TestBed.inject(HttpTestingController);
  });

  afterEach(() => backend.verify());

  it('trae la evaluación para rendir con su avance guardado', () => {
    let result: TakeEvaluation | undefined;
    api.getForTaking('7').subscribe((r) => (result = r));
    backend.expectOne('/api/students/me/evaluations/7').flush({
      id: 7,
      classId: 3,
      name: 'Fracciones 1',
      endDate: '2026-11-14',
      readingTitle: null,
      readingText: null,
      topic: { id: 4, code: 'fracciones', name: 'Fracciones' },
      subtopics: [{ id: 5, code: 'comparar-fracciones', name: 'Comparar fracciones' }],
      questions: [{ id: 11, subtopicId: 5, text: '¿Cuál es mayor?', options: [{ id: 21, text: '1/2' }] }],
      progress: BACKEND_PROGRESS,
    });
    expect(result?.id).toBe('7');
    expect(result?.questions).toEqual([
      { id: '11', subtopicId: '5', text: '¿Cuál es mayor?', options: [{ id: '21', text: '1/2' }] },
    ]);
    expect(result?.progress).toEqual(PROGRESS);
  });

  it('guarda el avance con los ids como números', () => {
    api.saveProgress('7', PROGRESS).subscribe();
    const req = backend.expectOne('/api/students/me/evaluations/7/progress');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(BACKEND_PROGRESS);
    req.flush(null, { status: 204, statusText: 'No Content' });
  });

  it('envía la telemetría', () => {
    api
      .sendTelemetry('7', [
        { questionId: '11', timeMs: 1200, optionChanges: 1, skipped: false, revisits: 0 },
      ])
      .subscribe();
    const req = backend.expectOne('/api/students/me/evaluations/7/telemetry');
    expect(req.request.body).toEqual([
      { questionId: 11, timeMs: 1200, optionChanges: 1, skipped: false, revisits: 0 },
    ]);
    req.flush(null, { status: 204, statusText: 'No Content' });
  });

  it('termina y devuelve el resultado', () => {
    let result: EvaluationResult | undefined;
    api.submit('7', PROGRESS).subscribe((r) => (result = r));
    const req = backend.expectOne('/api/students/me/evaluations/7/submit');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(BACKEND_PROGRESS);
    req.flush(BACKEND_RESULT);
    expect(result).toEqual(RESULT);
  });

  it('lee el resultado con sus niveles por subtema', () => {
    let result: EvaluationResult | undefined;
    api.getResult('7').subscribe((r) => (result = r));
    backend.expectOne('/api/students/me/evaluations/7/result').flush({
      ...BACKEND_RESULT,
      subtopics: [{ id: 5, code: 'comparar-fracciones', name: 'Comparar fracciones', level: 2 }],
    });
    expect(result?.subtopics).toEqual([
      { id: '5', code: 'comparar-fracciones', name: 'Comparar fracciones', level: 2 },
    ]);
  });

  it('deja pasar el 409 (no está abierta o ya la rindió)', () => {
    let status = 0;
    api.getForTaking('7').subscribe({ error: (e) => (status = e.status) });
    backend.expectOne('/api/students/me/evaluations/7').flush(null, { status: 409, statusText: '' });
    expect(status).toBe(409);
  });

  it('opción múltiple y respuesta corta: convierte choices y texts', () => {
    const progress: TakeProgress = {
      answers: {},
      choices: { '11': ['21', '22'] },
      texts: { '12': 'tres cuartos' },
      skipped: [],
      currentIndex: 0,
    };
    api.saveProgress('7', progress).subscribe();
    const req = backend.expectOne('/api/students/me/evaluations/7/progress');
    expect(req.request.body.choices).toEqual({ '11': [21, 22] });
    expect(req.request.body.texts).toEqual({ '12': 'tres cuartos' });
    req.flush(null, { status: 204, statusText: 'No Content' });

    let taken: TakeEvaluation | undefined;
    api.getForTaking('7').subscribe((r) => (taken = r));
    backend.expectOne('/api/students/me/evaluations/7').flush({
      id: 7,
      classId: 3,
      name: 'Tipos',
      endDate: null,
      readingTitle: null,
      readingText: null,
      topic: { id: 4, code: 'fracciones', name: 'Fracciones' },
      subtopics: [],
      questions: [{ id: 12, type: 'short', subtopicId: 5, text: 'Escribe', options: [] }],
      progress: { answers: {}, choices: { '11': [21, 22] }, texts: { '12': 'tres' }, skipped: [], currentIndex: 0 },
    });
    expect(taken?.questions[0].type).toBe('short');
    expect(taken?.progress?.choices).toEqual({ '11': ['21', '22'] });
    expect(taken?.progress?.texts).toEqual({ '12': 'tres' });
  });

  it('puede pedir keepalive para que el envío sobreviva al cierre de la página', () => {
    api.saveProgress('7', PROGRESS, { keepalive: true }).subscribe();
    const req = backend.expectOne('/api/students/me/evaluations/7/progress');
    expect(req.request.keepalive).toBe(true);
    req.flush(null, { status: 204, statusText: 'No Content' });
  });
});
