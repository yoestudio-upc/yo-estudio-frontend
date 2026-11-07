import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { SessionStore } from '../../auth/session-store';
import { fakeToken } from '../../auth/testing';
import { AuthApi } from '../auth.api';
import { hash01 } from './data/synthetic';
import { TeacherReportsMockApi } from './teacher-reports.mock';

describe('TeacherReportsMockApi', () => {
  function setup(teacherId = 't-1') {
    sessionStorage.clear();
    new SessionStore().write({
      accessToken: fakeToken('docente'),
      user: { id: teacherId, name: 'Rosa Díaz', role: 'docente' },
    });
    TestBed.configureTestingModule({
      providers: [{ provide: AuthApi, useValue: {} }, TeacherReportsMockApi],
    });
    return TestBed.inject(TeacherReportsMockApi);
  }

  it('lista a todo el salón; quien la rindió trae nivel, riesgo y explicación', async () => {
    const report = await firstValueFrom(setup().getResults('e-fracciones-u3'));
    expect(report.students).toHaveLength(26);
    const done = report.students.filter((s) => s.done);
    expect(done).toHaveLength(18);
    for (const s of done) {
      expect(s.prediction?.risk).toMatch(/high|medium|low/);
      expect(s.topicLevel).not.toBeNull();
      expect(s.factors.length).toBeGreaterThan(0);
    }
    const pending = report.students.find((s) => s.studentId === 's-1')!;
    expect(pending.done).toBe(false);
    expect(pending.prediction).toBeNull();
  });

  it('un docente que no es del curso recibe 404', async () => {
    const error = await firstValueFrom(setup('t-otro').getResults('e-fracciones-u3')).catch(
      (e: unknown) => e,
    );
    expect((error as HttpErrorResponse).status).toBe(404);
  });

  it('los datos de ejemplo son estables', () => {
    expect(hash01('s-3:e-1-q1')).toBe(hash01('s-3:e-1-q1'));
    expect(hash01('a')).not.toBe(hash01('b'));
  });
});
