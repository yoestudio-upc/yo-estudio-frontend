import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import {
  EvaluationDraft,
  TeacherEvaluationDetail,
  TeacherEvaluationSummary,
  TeacherQuestion,
} from '../../models/dto/teacher.dto';
import { API_URL } from '../api-url';
import { TeacherEvaluationHttpApi } from './teacher-evaluation.http';

const BACKEND_QUESTION = {
  id: 11,
  type: 'single',
  text: '¿Cuál es equivalente a 1/2?',
  points: 2,
  subtopicId: 5,
  options: [
    { id: 21, text: '2/4', correct: true },
    { id: 22, text: '1/3', correct: false },
  ],
};

const QUESTION: TeacherQuestion = {
  id: '11',
  type: 'single',
  text: '¿Cuál es equivalente a 1/2?',
  points: 2,
  subtopicId: '5',
  options: [
    { id: '21', text: '2/4', correct: true },
    { id: '22', text: '1/3', correct: false },
  ],
};

const BACKEND_DETAIL = {
  id: 7,
  classId: 3,
  name: 'Fracciones 1',
  startDate: '2026-11-07',
  endDate: '2026-11-14',
  status: 'draft',
  readingTitle: null,
  readingText: null,
  topic: { id: 4, code: 'fracciones', name: 'Fracciones' },
  subtopics: [{ id: 5, code: 'fracciones-equivalentes', name: 'Fracciones equivalentes' }],
  questions: [BACKEND_QUESTION],
};

const DETAIL: TeacherEvaluationDetail = {
  id: '7',
  classId: '3',
  name: 'Fracciones 1',
  startDate: '2026-11-07',
  endDate: '2026-11-14',
  status: 'draft',
  readingTitle: null,
  readingText: null,
  topic: { id: '4', code: 'fracciones', name: 'Fracciones' },
  subtopics: [{ id: '5', code: 'fracciones-equivalentes', name: 'Fracciones equivalentes' }],
  questions: [QUESTION],
};

const DRAFT: EvaluationDraft = {
  name: 'Fracciones 1',
  topicId: '4',
  subtopicIds: ['5', '6'],
  startDate: '2026-11-07',
  endDate: '2026-11-14',
  readingTitle: null,
  readingText: null,
};

describe('TeacherEvaluationHttpApi', () => {
  let api: TeacherEvaluationHttpApi;
  let backend: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        TeacherEvaluationHttpApi,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_URL, useValue: '/api' },
      ],
    });
    api = TestBed.inject(TeacherEvaluationHttpApi);
    backend = TestBed.inject(HttpTestingController);
  });

  afterEach(() => backend.verify());

  it('lista las evaluaciones del curso', () => {
    let result: TeacherEvaluationSummary[] = [];
    api.listByClass('3').subscribe((r) => (result = r));
    const { subtopics: _, questions: __, ...summary } = BACKEND_DETAIL;
    backend
      .expectOne('/api/teachers/me/courses/3/evaluations')
      .flush([{ ...summary, questionCount: 1, completedCount: 0, studentCount: 26 }]);
    const { subtopics: ___, questions: ____, ...expected } = DETAIL;
    expect(result).toEqual([{ ...expected, questionCount: 1, completedCount: 0, studentCount: 26 }]);
  });

  it('crea el borrador enviando los ids como números', () => {
    let result: TeacherEvaluationDetail | undefined;
    api.create('3', DRAFT).subscribe((r) => (result = r));
    const req = backend.expectOne('/api/teachers/me/courses/3/evaluations');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ ...DRAFT, topicId: 4, subtopicIds: [5, 6] });
    req.flush(BACKEND_DETAIL);
    expect(result).toEqual(DETAIL);
  });

  it('un borrador sin tema envía topicId null', () => {
    api.update('7', { ...DRAFT, topicId: null, subtopicIds: [] }).subscribe();
    const req = backend.expectOne('/api/teachers/me/evaluations/7');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body.topicId).toBeNull();
    req.flush(BACKEND_DETAIL);
  });

  it('publica y trae el detalle', () => {
    let result: TeacherEvaluationDetail | undefined;
    api.publish('7').subscribe((r) => (result = r));
    const req = backend.expectOne('/api/teachers/me/evaluations/7/publish');
    expect(req.request.method).toBe('POST');
    req.flush({ ...BACKEND_DETAIL, status: 'scheduled' });
    expect(result?.status).toBe('scheduled');
  });

  it('agrega, edita y borra preguntas', () => {
    const draft = {
      type: 'single' as const,
      subtopicId: '5',
      text: 'x',
      points: 2,
      options: [{ text: 'a', correct: true }],
    };
    let added: TeacherQuestion | undefined;
    api.addQuestion('7', draft).subscribe((r) => (added = r));
    const add = backend.expectOne('/api/teachers/me/evaluations/7/questions');
    expect(add.request.body.subtopicId).toBe(5);
    add.flush(BACKEND_QUESTION);
    expect(added).toEqual(QUESTION);

    api.updateQuestion('7', '11', draft).subscribe();
    const put = backend.expectOne('/api/teachers/me/evaluations/7/questions/11');
    expect(put.request.method).toBe('PUT');
    put.flush(BACKEND_QUESTION);

    api.deleteQuestion('7', '11').subscribe();
    const del = backend.expectOne('/api/teachers/me/evaluations/7/questions/11');
    expect(del.request.method).toBe('DELETE');
    del.flush(null, { status: 204, statusText: 'No Content' });
  });

  it('deja pasar el 422 con sus problemas para que el editor los muestre', () => {
    let problems: string[] = [];
    api.publish('7').subscribe({ error: (e) => (problems = e.error.problems) });
    backend
      .expectOne('/api/teachers/me/evaluations/7/publish')
      .flush({ problems: ['Agrega al menos una pregunta.'] }, { status: 422, statusText: '' });
    expect(problems).toEqual(['Agrega al menos una pregunta.']);
  });
});
