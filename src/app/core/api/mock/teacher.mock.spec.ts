import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { AuthApi } from '../auth.api';
import { SessionStore } from '../../auth/session-store';
import { fakeToken } from '../../auth/testing';
import { MockDb } from './mock-db';
import { TeacherClassMockApi } from './teacher-class.mock';
import { TeacherEvaluationMockApi } from './teacher-evaluation.mock';
import { MockEvaluation } from './data/evaluations';

describe('mocks del docente', () => {
  function setup(userId: string) {
    sessionStorage.clear();
    new SessionStore().write({
      accessToken: fakeToken('docente'),
      user: { id: userId, name: 'Prueba', role: 'docente' },
    });
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthApi, useValue: {} },
        TeacherClassMockApi,
        TeacherEvaluationMockApi,
      ],
    });
    return {
      classes: TestBed.inject(TeacherClassMockApi),
      evaluations: TestBed.inject(TeacherEvaluationMockApi),
    };
  }

  it('devuelve solo los cursos del docente en sesión', async () => {
    const { classes } = setup('t-1');
    const list = await firstValueFrom(classes.getMyClasses());
    expect(list.map((c) => c.id)).toEqual(['c-mat-4b', 'c-com-4b']);
    expect(list[0].studentCount).toBe(26);
    expect(list[0].topics.map((t) => t.name)).toContain('Fracciones');
  });

  it('el curso de otro docente responde 404', async () => {
    const { classes, evaluations } = setup('t-otro');
    const error = await firstValueFrom(classes.getClass('c-mat-4b')).catch((e: unknown) => e);
    expect((error as HttpErrorResponse).status).toBe(404);
    const error2 = await firstValueFrom(evaluations.listByClass('c-mat-4b')).catch((e) => e);
    expect((error2 as HttpErrorResponse).status).toBe(404);
  });

  it('las evaluaciones de ejemplo cubren publicada, programada y cerrada', async () => {
    const { evaluations } = setup('t-1');
    const list = await firstValueFrom(evaluations.listByClass('c-mat-4b'));
    expect(list.map((e) => e.status).sort()).toEqual(['closed', 'published', 'scheduled']);
  });

  describe('MockDb.statusOf', () => {
    const base: MockEvaluation = {
      id: 'e',
      classId: 'c',
      name: 'E',
      startDate: '2026-10-10',
      endDate: '2026-10-20',
      published: true,
      topicId: null,
      subtopicIds: [],
      questions: [],

      completedBy: [],
      readingTitle: null,
      readingText: null,
    };
    const db = () => TestBed.inject(MockDb);

    it('calcula el estado con las fechas', () => {
      expect(db().statusOf(base, '2026-10-09')).toBe('scheduled');
      expect(db().statusOf(base, '2026-10-10')).toBe('published');
      expect(db().statusOf(base, '2026-10-20')).toBe('published');
      expect(db().statusOf(base, '2026-10-21')).toBe('closed');
      expect(db().statusOf({ ...base, published: false }, '2026-10-15')).toBe('draft');
    });
  });
});
