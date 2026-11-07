import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { SessionStore } from '../../auth/session-store';
import { fakeToken } from '../../auth/testing';
import { AuthApi } from '../auth.api';
import { MockDb } from './mock-db';
import { StudentClassMockApi } from './student-class.mock';
import { StudentEvaluationMockApi } from './student-evaluation.mock';

describe('mocks del estudiante', () => {
  const errorOf = (p: Promise<unknown>) => p.then(() => null).catch((e) => e as HttpErrorResponse);

  function setup(studentId: string) {
    sessionStorage.clear();
    new SessionStore().write({
      accessToken: fakeToken('estudiante'),
      user: { id: studentId, name: 'Prueba', role: 'estudiante' },
    });
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthApi, useValue: {} },
        StudentClassMockApi,
        StudentEvaluationMockApi,
      ],
    });
    return {
      classes: TestBed.inject(StudentClassMockApi),
      evaluations: TestBed.inject(StudentEvaluationMockApi),
      db: TestBed.inject(MockDb),
    };
  }

  it('Mateo se une a Comunicación con el código; un código falso o repetido falla', async () => {
    const { classes } = setup('s-2');
    expect((await firstValueFrom(classes.getMyClasses())).map((c) => c.id)).toEqual(['c-mat-4b']);
    expect((await errorOf(firstValueFrom(classes.join('ZZZZZZ'))))?.status).toBe(404);
    const joined = await firstValueFrom(classes.join(' m3r8tw '));
    expect(joined.name).toBe('Comunicación');
    expect((await errorOf(firstValueFrom(classes.join('M3R8TW'))))?.status).toBe(409);
  });

  it('la vista del curso trae pendientes, la meta y el avance de Camila', async () => {
    const { classes } = setup('s-1');
    const o = await firstValueFrom(classes.getOverview('c-mat-4b'));
    expect(o.pending.map((e) => e.name)).toEqual(['Fracciones – Unidad 3']);
    expect(o.done.map((e) => e.name)).toEqual(['Números decimales']);
    expect(o.nextGoal?.name).toBe('Números decimales');
    expect(o.achievedCount).toBe(1);
    expect(o.lastEvaluationName).toBe('Números decimales');
  });

  it('para rendir no manda la respuesta correcta ni datos de riesgo', async () => {
    const { evaluations } = setup('s-1');
    const take = await firstValueFrom(evaluations.getForTaking('e-fracciones-u3'));
    const json = JSON.stringify(take);
    expect(json).not.toContain('correct');
    expect(json).not.toContain('points');
    expect(json).not.toMatch(/risk|riesgo|predic/i);
    expect(take.questions).toHaveLength(10);
  });

  it('guarda el avance, recibe la telemetría sumada y al terminar da el resultado', async () => {
    const { evaluations, db } = setup('s-1');
    const id = 'e-fracciones-u3';
    const take = await firstValueFrom(evaluations.getForTaking(id));
    const [q1, q2] = take.questions;
    const right = 'e-fracciones-u3-q1-o0';

    await firstValueFrom(
      evaluations.sendTelemetry(id, [
        { questionId: q1.id, timeMs: 1000, optionChanges: 1, skipped: false, revisits: 0 },
      ]),
    );
    await firstValueFrom(
      evaluations.sendTelemetry(id, [
        { questionId: q1.id, timeMs: 500, optionChanges: 0, skipped: true, revisits: 1 },
      ]),
    );
    expect(db.events.get(`${id}:s-1:${q1.id}`)).toEqual({
      questionId: q1.id,
      timeMs: 1500,
      optionChanges: 1,
      skipped: true,
      revisits: 1,
    });

    const progress = { answers: { [q1.id]: right }, skipped: [q2.id], currentIndex: 1 };
    await firstValueFrom(evaluations.saveProgress(id, progress));
    expect((await firstValueFrom(evaluations.getForTaking(id))).progress).toEqual(progress);

    const result = await firstValueFrom(evaluations.submit(id, progress));
    expect(result).toMatchObject({ totalCount: 10, answeredCount: 1, correctCount: 1 });
    expect(result.subtopics.map((s) => s.name)).toContain('Fracciones equivalentes');
    expect(JSON.stringify(result)).not.toMatch(/risk|riesgo|predic/i);

    // No se rinde dos veces
    expect((await errorOf(firstValueFrom(evaluations.getForTaking(id))))?.status).toBe(409);
  });
});
