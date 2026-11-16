import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { AuthApi } from '../../../core/api/auth.api';
import { StudentClassApi } from '../../../core/api/student-class.api';
import { StudentProgressApi } from '../../../core/api/student-progress.api';
import { StudentProgress } from '../../../core/models/dto/student.dto';
import { Progress } from './progress';

const classes = [
  { id: 'c-mat', name: 'Matemática', subject: 'matematica' },
  { id: 'c-com', name: 'Comunicación', subject: 'comunicacion' },
];

const progressOf = (classId: string): StudentProgress => ({
  classId,
  profile:
    classId === 'c-mat'
      ? { code: 'calm', name: 'Paso a paso', description: 'Te tomas tu tiempo.' }
      : null,
  topics: [
    {
      topic: {
        id: `t-${classId}`,
        code: 'fracciones',
        name: classId === 'c-mat' ? 'Fracciones' : 'Gramática',
      },
      achieved: 1,
      subtopics: [
        { id: 'a', code: 'a', name: 'Equivalentes', level: 3 },
        { id: 'b', code: 'b', name: 'Sumar', level: null },
      ],
    },
  ],
});

describe('Progress (07)', () => {
  async function render(getMyClasses: () => Observable<unknown> = () => of(classes)) {
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthApi, useValue: {} },
        { provide: StudentClassApi, useValue: { getMyClasses } },
        {
          provide: StudentProgressApi,
          useValue: { getProgress: (id: string) => of(progressOf(id)) },
        },
      ],
    });
    const fixture = TestBed.createComponent(Progress);
    await fixture.whenStable();
    return { fixture, el: fixture.nativeElement as HTMLElement };
  }

  it('muestra el avance del primer curso, con texto en cada subtema', async () => {
    const { el } = await render();
    expect(el.querySelector('[role="tab"][aria-selected="true"]')?.textContent).toContain(
      'Matemática',
    );
    expect(el.textContent).toContain('1 de 2 subtemas logrados');
    const rows = [...el.querySelectorAll('.subtopics li')].map((r) => r.textContent ?? '');
    expect(rows[0]).toContain('¡Logrado!');
    expect(rows[1]).toContain('Aún sin evaluar');
    expect(el.querySelector('.profile-name')?.textContent).toContain('Paso a paso');
  });

  it('las pestañas cambian de curso con clic y con flechas', async () => {
    const { el, fixture } = await render();
    const tab = el.querySelector<HTMLButtonElement>('#tab-c-mat')!;
    tab.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
    await fixture.whenStable();
    expect(el.querySelector('[role="tab"][aria-selected="true"]')?.id).toBe('tab-c-com');
    expect(el.querySelector('.topic h2')?.textContent).toContain('Gramática');
    expect(el.textContent).toContain('Yoyo te contará cómo respondes');
  });

  it('si no cargan los cursos avisa y "Intentar otra vez" los vuelve a pedir', async () => {
    let fail = true;
    const { el, fixture } = await render(() =>
      fail ? throwError(() => new HttpErrorResponse({ status: 0 })) : of(classes),
    );
    expect(el.querySelector('.state--error')?.textContent).toContain('No pudimos cargar tu avance');
    fail = false;
    el.querySelector<HTMLButtonElement>('.state--error button')!.click();
    await fixture.whenStable();
    await new Promise((r) => setTimeout(r));
    await fixture.whenStable();
    expect(el.textContent).toContain('1 de 2 subtemas logrados');
  });
});
