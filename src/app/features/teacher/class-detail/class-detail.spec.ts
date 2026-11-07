import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Observable, of, throwError } from 'rxjs';
import { AuthApi } from '../../../core/api/auth.api';
import { TeacherClassApi } from '../../../core/api/teacher-class.api';
import { TeacherEvaluationApi } from '../../../core/api/teacher-evaluation.api';
import { TeacherClassDetail, TeacherEvaluationSummary } from '../../../core/models/dto/teacher.dto';
import { ClassDetail } from './class-detail';

const STUDENTS = Array.from({ length: 10 }, (_, i) => ({ id: `s-${i}`, name: `Alumno ${i}` }));

const DETAIL: TeacherClassDetail = {
  id: 'c-1',
  name: 'Matemática',
  subject: 'matematica',
  grade: 4,
  section: 'B',
  joinCode: 'K7P2QX',
  studentCount: STUDENTS.length,
  topics: [],
  students: STUDENTS,
};

const evaluation = (
  id: string,
  status: TeacherEvaluationSummary['status'],
): TeacherEvaluationSummary => ({
  id,
  classId: 'c-1',
  name: `Eval ${id}`,
  status,
  startDate: '2026-09-29',
  endDate: '2026-10-03',
  readingTitle: null,
  readingText: null,
  topic: { id: 't', code: 'fracciones', name: 'Fracciones' },
  questionCount: 10,
  completedCount: 7,
  studentCount: 10,
});

describe('ClassDetail (D1)', () => {
  async function render(getClass: () => Observable<TeacherClassDetail> = () => of(DETAIL)) {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: AuthApi, useValue: {} },
        { provide: TeacherClassApi, useValue: { getClass } },
        {
          provide: TeacherEvaluationApi,
          useValue: {
            listByClass: () =>
              of([
                evaluation('a', 'closed'),
                evaluation('b', 'scheduled'),
                evaluation('c', 'published'),
              ]),
          },
        },
      ],
    });
    const fixture = TestBed.createComponent(ClassDetail);
    fixture.componentRef.setInput('classId', 'c-1');
    await fixture.whenStable();
    return { fixture, el: fixture.nativeElement as HTMLElement };
  }

  it('ordena: publicada, programada, cerrada', async () => {
    const { el } = await render();
    const names = [...el.querySelectorAll('.row h3')].map((h) => h.textContent?.trim());
    expect(names).toEqual(['Eval c', 'Eval b', 'Eval a']);
  });

  it('arma la línea de detalle y la acción según el estado', async () => {
    const { el } = await render();
    const [published, scheduled] = [...el.querySelectorAll('.row')];
    expect(published.textContent).toContain(
      '10 preguntas · Del 29 de septiembre al 3 de octubre · 7 de 10 la resolvieron',
    );
    expect(published.querySelector('a')?.getAttribute('href')).toBe(
      '/docente/evaluaciones/c/resultados',
    );
    expect(scheduled.textContent).not.toContain('la resolvieron');
    expect(scheduled.querySelector('a')?.getAttribute('href')).toBe(
      '/docente/evaluaciones/b/editar',
    );
  });

  it('muestra 8 alumnos y despliega el resto', async () => {
    const { el, fixture } = await render();
    expect(el.querySelectorAll('.student-list li').length).toBe(8);
    const more = el.querySelector<HTMLButtonElement>('button[aria-controls="students-list"]')!;
    expect(more.getAttribute('aria-expanded')).toBe('false');
    more.click();
    await fixture.whenStable();
    expect(el.querySelectorAll('.student-list li').length).toBe(10);
    expect(more.getAttribute('aria-expanded')).toBe('true');
  });

  it('muestra el código para unirse', async () => {
    const { el } = await render();
    expect(el.textContent).toContain('Código para unirse: K7P2QX');
  });

  it('con un curso inexistente lo dice y ofrece volver', async () => {
    const { el } = await render(() => throwError(() => new HttpErrorResponse({ status: 404 })));
    expect(el.querySelector('[role="alert"]')?.textContent).toContain('No encontramos este curso');
    expect(el.querySelector('a[href="/docente/cursos"]')).not.toBeNull();
  });
});
