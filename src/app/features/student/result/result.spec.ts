import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { AuthApi } from '../../../core/api/auth.api';
import { StudentEvaluationApi } from '../../../core/api/student-evaluation.api';
import { SessionStore } from '../../../core/auth/session-store';
import { fakeToken } from '../../../core/auth/testing';
import { EvaluationResult as ResultData } from '../../../core/models/dto/student.dto';
import { EvaluationResult } from './result';

describe('EvaluationResult (05)', () => {
  async function render(data: Partial<ResultData>) {
    sessionStorage.clear();
    new SessionStore().write({
      accessToken: fakeToken('estudiante'),
      user: { id: 's-1', name: 'Camila Rojas', role: 'estudiante' },
    });
    const result: ResultData = {
      evaluationId: 'e-1',
      classId: 'c-1',
      name: 'Fracciones',
      topic: { id: 't', code: 'fracciones', name: 'Fracciones' },
      totalCount: 10,
      answeredCount: 10,
      correctCount: 7,
      subtopics: [
        { id: 'a', code: 'a', name: 'Fracciones equivalentes', level: 3 },
        { id: 'b', code: 'b', name: 'Simplificar fracciones', level: 2 },
        { id: 'c', code: 'c', name: 'Sumar fracciones', level: 1 },
      ],
      ...data,
    };
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: AuthApi, useValue: {} },
        { provide: StudentEvaluationApi, useValue: { getResult: () => of(result) } },
      ],
    });
    const fixture = TestBed.createComponent(EvaluationResult);
    fixture.componentRef.setInput('evaluationId', 'e-1');
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  it('resume en positivo con el nombre del alumno', async () => {
    const el = await render({});
    expect(el.textContent).toContain(
      'Respondiste las 10 preguntas y acertaste 7. ¡Muy bien, Camila!',
    );
  });

  it('si respondió menos o acertó poco, igual es amable', async () => {
    const el = await render({ answeredCount: 8, correctCount: 3 });
    expect(el.textContent).toContain(
      'Respondiste 8 de 10 preguntas y acertaste 3. ¡Gracias por tu esfuerzo, Camila!',
    );
  });

  it('cada subtema lleva estrellas y un mensaje en texto', async () => {
    const el = await render({});
    const rows = [...el.querySelectorAll('.subtopic')].map((r) => r.textContent ?? '');
    expect(rows[0]).toContain('¡Lo lograste!');
    expect(rows[1]).toContain('¡Ya casi!');
    expect(rows[2]).toContain('Vamos a practicarlo');
    expect(el.querySelector('[role="img"]')?.getAttribute('aria-label')).toBe(
      '3 de 3 estrellas: ¡Logrado!',
    );
    expect(el.textContent).not.toMatch(/riesgo/i);
  });
});
