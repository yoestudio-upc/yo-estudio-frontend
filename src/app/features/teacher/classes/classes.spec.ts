import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { TeacherClassApi } from '../../../core/api/teacher-class.api';
import { TeacherClassSummary } from '../../../core/models/dto/teacher.dto';
import { TeacherClasses } from './classes';

const CLASSES: TeacherClassSummary[] = [
  {
    id: 'c-1',
    name: 'Matemática',
    subject: 'matematica',
    grade: 4,
    section: 'B',
    joinCode: 'K7P2QX',
    studentCount: 26,
    topics: [{ id: 't', code: 'fracciones', name: 'Fracciones' }],
  },
  {
    id: 'c-2',
    name: 'Comunicación',
    subject: 'comunicacion',
    grade: 4,
    section: 'B',
    joinCode: 'M3R8TW',
    studentCount: 26,
    topics: [],
  },
];

describe('TeacherClasses', () => {
  async function render() {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: TeacherClassApi, useValue: { getMyClasses: () => of(CLASSES) } },
      ],
    });
    const fixture = TestBed.createComponent(TeacherClasses);
    await fixture.whenStable();
    return { fixture, el: fixture.nativeElement as HTMLElement };
  }

  it('lista los cursos con su código y un enlace a cada uno', async () => {
    const { el } = await render();
    const titles = [...el.querySelectorAll('h2')].map((h) => h.textContent?.trim());
    expect(titles).toEqual(['Matemática · 4.° B', 'Comunicación · 4.° B']);
    expect(el.textContent).toContain('K7P2QX');
    expect(el.querySelector('a[href="/docente/cursos/c-1"]')).not.toBeNull();
  });

  it('filtra sin importar tildes ni mayúsculas', async () => {
    const { el, fixture } = await render();
    const input = el.querySelector<HTMLInputElement>('input[type="search"]')!;
    input.value = 'comunicacion';
    input.dispatchEvent(new Event('input'));
    await fixture.whenStable();
    expect(el.querySelectorAll('h2').length).toBe(1);

    input.value = 'ciencias';
    input.dispatchEvent(new Event('input'));
    await fixture.whenStable();
    expect(el.textContent).toContain('No encontramos cursos con «ciencias»');
  });

  it('"Crear nuevo curso" avisa que llega pronto', async () => {
    const { el, fixture } = await render();
    const button = [...el.querySelectorAll('button')].find((b) =>
      b.textContent?.includes('Crear nuevo curso'),
    )!;
    expect(button.getAttribute('aria-disabled')).toBe('true');
    button.click();
    await fixture.whenStable();
    expect(el.querySelector('[role="status"]')?.textContent).toContain('Muy pronto');
  });
});
