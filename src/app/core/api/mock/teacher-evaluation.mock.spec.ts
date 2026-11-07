import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { SessionStore } from '../../auth/session-store';
import { fakeToken } from '../../auth/testing';
import { QuestionDraft } from '../../models/dto/teacher.dto';
import { AuthApi } from '../auth.api';
import { addDays, todayIso } from './mock-clock';
import { TeacherEvaluationMockApi } from './teacher-evaluation.mock';

// Recorre el flujo HU01 completo contra el mock (como lo haría el backend)
describe('TeacherEvaluationMockApi', () => {
  let api: TeacherEvaluationMockApi;
  const errorOf = (p: Promise<unknown>) => p.then(() => null).catch((e) => e as HttpErrorResponse);

  beforeEach(() => {
    sessionStorage.clear();
    new SessionStore().write({
      accessToken: fakeToken('docente'),
      user: { id: 't-1', name: 'Rosa Díaz', role: 'docente' },
    });
    TestBed.configureTestingModule({
      providers: [{ provide: AuthApi, useValue: {} }, TeacherEvaluationMockApi],
    });
    api = TestBed.inject(TeacherEvaluationMockApi);
  });

  it('crea un borrador, agrega una pregunta y lo publica cuando está completo', async () => {
    const today = todayIso();
    const draft = {
      name: 'Geometría – repaso',
      topicId: 'tag-geometria',
      subtopicIds: ['tag-perimetro'],
      startDate: today,
      endDate: addDays(today, 3),
      readingTitle: null,
      readingText: null,
    };
    const created = await firstValueFrom(api.create('c-mat-4b', draft));
    expect(created.status).toBe('draft');

    // Sin preguntas no se publica
    const incomplete = await errorOf(firstValueFrom(api.publish(created.id)));
    expect(incomplete?.status).toBe(422);
    expect(incomplete?.error.problems).toContain('Agrega al menos una pregunta.');

    const question: QuestionDraft = {
      type: 'single',
      acceptedAnswers: [],
      subtopicId: 'tag-perimetro',
      text: '¿Cuál es el perímetro de un cuadrado de 2 cm de lado?',
      points: 1,
      options: [
        { text: '8 cm', correct: true },
        { text: '4 cm', correct: false },
      ],
    };
    await firstValueFrom(api.addQuestion(created.id, question));
    const published = await firstValueFrom(api.publish(created.id));
    expect(published.status).toBe('published');
    expect(published.questions).toHaveLength(1);
  });

  it('rechaza preguntas de un subtema que la evaluación no marcó', async () => {
    const error = await errorOf(
      firstValueFrom(
        api.addQuestion('e-perimetro-area', {
          type: 'single',
          acceptedAnswers: [],
          subtopicId: 'tag-sumar-fracciones',
          text: 'x',
          points: 1,
          options: [
            { text: 'a', correct: true },
            { text: 'b', correct: false },
          ],
        }),
      ),
    );
    expect(error?.status).toBe(422);
  });

  it('no deja editar una evaluación que ya empezó', async () => {
    const error = await errorOf(
      firstValueFrom(api.deleteQuestion('e-fracciones-u3', 'e-fracciones-u3-q1')),
    );
    expect(error?.status).toBe(409);
  });
});
