import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { SessionStore } from '../../auth/session-store';
import { fakeToken } from '../../auth/testing';
import { AuthApi } from '../auth.api';
import { MockDb } from './mock-db';
import { StudentProgressMockApi } from './student-progress.mock';

describe('StudentProgressMockApi', () => {
  function setup(studentId: string) {
    sessionStorage.clear();
    new SessionStore().write({
      accessToken: fakeToken('estudiante'),
      user: { id: studentId, name: 'Prueba', role: 'estudiante' },
    });
    TestBed.configureTestingModule({
      providers: [{ provide: AuthApi, useValue: {} }, StudentProgressMockApi],
    });
    return { api: TestBed.inject(StudentProgressMockApi), db: TestBed.inject(MockDb) };
  }

  it('las metas priorizan el subtema con menor nivel y dicen cómo practicar', async () => {
    const { api } = setup('s-1');
    const goals = await firstValueFrom(api.getGoals());
    expect(goals.map((g) => [g.priority, g.subtopic.name, g.level])).toEqual([
      [1, 'Números decimales', 2],
    ]);
    expect(goals[0].practice.kind).toBe('written');
    expect(JSON.stringify(goals)).not.toMatch(/risk|riesgo|predic/i);
  });

  it('sin evaluaciones rendidas no hay metas ni perfil', async () => {
    const { api } = setup('s-2');
    expect(await firstValueFrom(api.getGoals())).toEqual([]);
    expect((await firstValueFrom(api.getProgress('c-mat-4b'))).profile).toBeNull();
  });

  it('el avance lista todos los subtemas del curso, con nivel o sin evaluar', async () => {
    const { api } = setup('s-1');
    const progress = await firstValueFrom(api.getProgress('c-mat-4b'));
    const numbers = progress.topics.find((t) => t.topic.name === 'Números y operaciones')!;
    expect(numbers.subtopics.map((s) => [s.name, s.level])).toEqual([
      ['Multiplicación', 3],
      ['Números decimales', 2],
    ]);
    expect(numbers.achieved).toBe(1);
    const fractions = progress.topics.find((t) => t.topic.name === 'Fracciones')!;
    expect(fractions.subtopics.every((s) => s.level === null)).toBe(true);
  });

  it('el perfil sale de la telemetría', async () => {
    const { api, db } = setup('s-1');
    db.events.set('e-x:s-1:q1', {
      questionId: 'q1',
      timeMs: 20000,
      optionChanges: 3,
      skipped: false,
      revisits: 0,
    });
    const progress = await firstValueFrom(api.getProgress('c-mat-4b'));
    expect(progress.profile?.code).toBe('explorer');
  });
});
