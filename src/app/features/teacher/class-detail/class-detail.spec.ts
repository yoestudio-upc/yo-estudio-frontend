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
  teachers: [{ id: 't-1', name: 'Rosa Díaz' }],
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
  let addTeacher: ReturnType<typeof vi.fn>;

  async function render(getClass: () => Observable<TeacherClassDetail> = () => of(DETAIL)) {
    addTeacher = vi.fn();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: AuthApi, useValue: {} },
        { provide: TeacherClassApi, useValue: { getClass, addTeacher } },
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

  async function openAddTeacher(el: HTMLElement, fixture: { whenStable(): Promise<unknown> }, username: string) {
    el.querySelector<HTMLButtonElement>('.add-teacher-toggle')!.click();
    await fixture.whenStable();
    const input = el.querySelector<HTMLInputElement>('#teacher-username')!;
    input.value = username;
    input.dispatchEvent(new Event('input'));
    el.querySelector<HTMLFormElement>('.add-teacher button[type="submit"]')!.click();
    await fixture.whenStable();
  }

  it('lista a los docentes del curso', async () => {
    const { el } = await render();
    const rows = [...el.querySelectorAll('.teacher-list li')];
    expect(rows.length).toBe(1);
    expect(rows[0].textContent).toContain('Rosa Díaz');
  });

  it('agrega un docente y recarga el detalle', async () => {
    let calls = 0;
    const { el, fixture } = await render(() => {
      calls++;
      return of(DETAIL);
    });
    addTeacher.mockReturnValue(of({ id: 't-2', name: 'Luis Paz' }));
    await openAddTeacher(el, fixture, ' luis.paz ');
    expect(addTeacher).toHaveBeenCalledWith('c-1', 'luis.paz');
    expect(el.querySelector('.form-notice')?.textContent).toContain('Luis Paz ahora es docente');
    expect(el.querySelector('#teacher-username')).toBeNull();
    expect(calls).toBe(2);
  });

  it('explica por qué no pudo agregar al docente', async () => {
    const { el, fixture } = await render();
    const cases: [HttpErrorResponse, string][] = [
      [new HttpErrorResponse({ status: 404 }), 'No encontramos a ese usuario'],
      [new HttpErrorResponse({ status: 409 }), 'Ya es docente de este curso'],
      [
        new HttpErrorResponse({ status: 422, error: { problems: ['Ese usuario no es docente.'] } }),
        'Ese usuario no es docente.',
      ],
    ];
    el.querySelector<HTMLButtonElement>('.add-teacher-toggle')!.click();
    await fixture.whenStable();
    for (const [error, message] of cases) {
      addTeacher.mockReturnValue(throwError(() => error));
      const input = el.querySelector<HTMLInputElement>('#teacher-username')!;
      input.value = 'alguien';
      input.dispatchEvent(new Event('input'));
      el.querySelector<HTMLFormElement>('.add-teacher button[type="submit"]')!.click();
      await fixture.whenStable();
      expect(el.querySelector('.add-teacher [role="alert"]')?.textContent).toContain(message);
    }
  });

  it('pide el usuario antes de llamar a la API', async () => {
    const { el, fixture } = await render();
    await openAddTeacher(el, fixture, '   ');
    expect(addTeacher).not.toHaveBeenCalled();
    expect(el.querySelector('.add-teacher [role="alert"]')?.textContent).toContain('Escribe el usuario');
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
