import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { TeacherReportsApi } from '../../../core/api/teacher-reports.api';
import { EvaluationReport, StudentDiagnostic } from '../../../core/models/dto/teacher.dto';
import { EvaluationResults } from './results';

const student = (
  id: string,
  name: string,
  risk: 'high' | 'medium' | 'low' | null,
): StudentDiagnostic => ({
  studentId: id,
  name,
  done: risk !== null,
  correctCount: risk ? 6 : null,
  topicLevel: risk ? 2 : null,
  subtopics: [{ id: 'st', code: 'st', name: 'Sumar fracciones', level: risk ? 1 : null }],
  prediction: risk ? { level: risk === 'high' ? 1 : 2, risk } : null,
  factors: risk
    ? [
        { label: 'Nivel en Sumar fracciones: En inicio', weight: -0.2 },
        { label: 'Nivel en Comparar fracciones: Logrado', weight: 0.1 },
      ]
    : [],
  profile: risk ? { name: 'Con buen ritmo', note: 'Responde muy rápido.' } : null,
  goals: risk ? [{ subtopic: 'Sumar fracciones', practice: 'Ejercicios en el cuaderno.' }] : [],
});

const REPORT: EvaluationReport = {
  evaluation: {
    id: 'e-1',
    name: 'Fracciones – Unidad 3',
    status: 'published',
    startDate: '2026-10-21',
    endDate: '2026-10-26',
    topic: { id: 't', code: 'fracciones', name: 'Fracciones' },
    questionCount: 10,
  },
  course: { id: 'c-1', name: 'Matemática', grade: 4, section: 'B' },
  students: [
    student('s-1', 'Camila Rojas', null),
    student('s-2', 'Bruno Low', 'low'),
    student('s-3', 'Ana High', 'high'),
  ],
};

describe('EvaluationResults (docente)', () => {
  async function render() {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: TeacherReportsApi, useValue: { getResults: () => of(REPORT) } },
      ],
    });
    const fixture = TestBed.createComponent(EvaluationResults);
    fixture.componentRef.setInput('evaluationId', 'e-1');
    await fixture.whenStable();
    return { fixture, el: fixture.nativeElement as HTMLElement };
  }

  const names = (el: HTMLElement) =>
    [...el.querySelectorAll('tbody .student')].map((b) => b.textContent?.trim());

  it('ordena por riesgo y deja al final a quien no la resolvió', async () => {
    const { el } = await render();
    expect(names(el)).toEqual(['AH Ana High', 'BL Bruno Low', 'CR Camila Rojas']);
    expect(el.querySelector('.summary')?.textContent).toContain('2 de 3');
  });

  it('el riesgo siempre va con texto', async () => {
    const { el } = await render();
    const risks = [...el.querySelectorAll('tbody .risk')].map((r) => r.textContent?.trim());
    expect(risks).toEqual(['Alto', 'Bajo']);
  });

  it('muestra el detalle con predicción y explicación SHAP del elegido', async () => {
    const { el } = await render();
    const detail = el.querySelector('#student-detail')!;
    expect(detail.textContent).toContain('Ana High');
    expect(detail.textContent).toContain('Riesgo alto');
    expect(detail.textContent).toContain('Aumenta el riesgo');
    expect(detail.textContent).toContain('Reduce el riesgo');
    expect(detail.textContent).toContain('Sumar fracciones');
  });

  it('filtra por riesgo y por sin resolver', async () => {
    const { el, fixture } = await render();
    const filter = (text: string) =>
      [...el.querySelectorAll<HTMLButtonElement>('.filter')].find((b) =>
        b.textContent?.includes(text),
      )!;
    filter('En riesgo').click();
    await fixture.whenStable();
    expect(names(el)).toEqual(['AH Ana High']);
    filter('Sin resolver').click();
    await fixture.whenStable();
    expect(names(el)).toEqual(['CR Camila Rojas']);
  });

  it('al elegir a alguien que no la resolvió lo indica', async () => {
    const { el, fixture } = await render();
    [...el.querySelectorAll<HTMLButtonElement>('tbody .student')][2].click();
    await fixture.whenStable();
    expect(el.querySelector('#student-detail')?.textContent).toContain(
      'Aún no resuelve esta evaluación',
    );
  });
});
