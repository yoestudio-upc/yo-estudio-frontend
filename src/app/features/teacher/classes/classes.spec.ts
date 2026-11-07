import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
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
  let create: ReturnType<typeof vi.fn>;
  let getMyClasses: ReturnType<typeof vi.fn>;

  async function render() {
    create = vi.fn();
    getMyClasses = vi.fn(() => of(CLASSES));
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: TeacherClassApi, useValue: { getMyClasses, create } },
      ],
    });
    const fixture = TestBed.createComponent(TeacherClasses);
    await fixture.whenStable();
    return { fixture, el: fixture.nativeElement as HTMLElement };
  }

  function button(el: HTMLElement, text: string): HTMLButtonElement {
    return [...el.querySelectorAll('button')].find((b) => b.textContent?.includes(text))!;
  }

  async function openForm(el: HTMLElement, fixture: { whenStable(): Promise<unknown> }) {
    button(el, 'Crear nuevo curso').click();
    await fixture.whenStable();
    return el.querySelector<HTMLFormElement>('#create-panel')!;
  }

  async function typeSection(el: HTMLElement, value: string) {
    const input = el.querySelector<HTMLInputElement>('#create-section')!;
    input.value = value;
    input.dispatchEvent(new Event('input'));
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

  it('"Crear nuevo curso" abre y cierra el formulario', async () => {
    const { el, fixture } = await render();
    const toggle = button(el, 'Crear nuevo curso');
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(await openForm(el, fixture)).not.toBeNull();
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    button(el, 'Cancelar').click();
    await fixture.whenStable();
    expect(el.querySelector('#create-panel')).toBeNull();
  });

  it('crea el curso, muestra el código y recarga la lista', async () => {
    const { el, fixture } = await render();
    await openForm(el, fixture);
    create.mockReturnValue(of({ ...CLASSES[0], id: 'c-9', section: 'C', joinCode: 'H4KZ2P' }));
    await typeSection(el, ' c ');
    button(el, 'Crear curso').click();
    await fixture.whenStable();

    expect(create).toHaveBeenCalledWith({ subject: 'matematica', grade: 4, section: 'C' });
    expect(el.querySelector('.form-notice')?.textContent).toContain('Matemática · 4.° C');
    expect(el.querySelector('.form-notice')?.textContent).toContain('H4KZ2P');
    expect(el.querySelector('#create-panel')).toBeNull();
    expect(getMyClasses).toHaveBeenCalledTimes(2);
  });

  it('pide la sección antes de llamar a la API', async () => {
    const { el, fixture } = await render();
    await openForm(el, fixture);
    await typeSection(el, '4');
    button(el, 'Crear curso').click();
    await fixture.whenStable();
    expect(create).not.toHaveBeenCalled();
    expect(el.querySelector('[role="alert"]')?.textContent).toContain('una o dos letras');
  });

  it('si la API rechaza los datos lo dice en el formulario', async () => {
    const { el, fixture } = await render();
    await openForm(el, fixture);
    create.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 422 })));
    await typeSection(el, 'B');
    button(el, 'Crear curso').click();
    await fixture.whenStable();
    expect(el.querySelector('[role="alert"]')?.textContent).toContain('Revisa el área');
    expect(el.querySelector('#create-panel')).not.toBeNull();
  });
});
