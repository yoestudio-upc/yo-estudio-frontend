import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { TagCatalogApi } from '../../../core/api/tag-catalog.api';
import { TeacherClassApi } from '../../../core/api/teacher-class.api';
import { TeacherEvaluationApi } from '../../../core/api/teacher-evaluation.api';
import { CatalogTopic, TeacherEvaluationDetail } from '../../../core/models/dto/teacher.dto';
import { Confirm } from '../../../shared/ui/confirm-dialog/confirm-dialog';
import { EvaluationEditor } from './evaluation-editor';

const CATALOG: CatalogTopic[] = [
  {
    id: 'tag-fracciones',
    code: 'fracciones',
    name: 'Fracciones',
    subject: 'matematica',
    subtopics: [
      { id: 'st-sumar', code: 'sumar', name: 'Sumar fracciones' },
      { id: 'st-comparar', code: 'comparar', name: 'Comparar fracciones' },
    ],
  },
];

const EXISTING: TeacherEvaluationDetail = {
  id: 'e-1',
  classId: 'c-1',
  name: 'Fracciones – Unidad 3',
  status: 'draft',
  startDate: null,
  endDate: null,
  readingTitle: null,
  readingText: null,
  topic: { id: 'tag-fracciones', code: 'fracciones', name: 'Fracciones' },
  subtopics: [{ id: 'st-sumar', code: 'sumar', name: 'Sumar fracciones' }],
  questions: [
    {
      id: 'q-1',
      type: 'single',
      subtopicId: 'st-sumar',
      text: '¿Cuánto es 1/4 + 2/4?',
      points: 2,
      options: [
        { id: 'o1', text: '3/4', correct: true },
        { id: 'o2', text: '3/8', correct: false },
      ],
    },
  ],
};

describe('EvaluationEditor (D2)', () => {
  let api: Record<string, ReturnType<typeof vi.fn>>;
  let navigate: ReturnType<typeof vi.fn>;
  let confirmAnswer: boolean;

  async function render(inputs: { classId?: string; evaluationId?: string }) {
    api = {
      get: vi.fn(() => of(structuredClone(EXISTING))),
      create: vi.fn((_c, d) => of({ ...EXISTING, ...d, id: 'e-new', questions: [] })),
      update: vi.fn((id, d) => of({ ...EXISTING, id, name: d.name })),
      publish: vi.fn(),
      deleteQuestion: vi.fn(() => of(undefined)),
    };
    confirmAnswer = true;
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: TeacherEvaluationApi, useValue: api },
        {
          provide: TeacherClassApi,
          useValue: {
            getClass: () =>
              of({ id: 'c-1', name: 'Matemática', grade: 4, section: 'B', subject: 'matematica' }),
          },
        },
        { provide: TagCatalogApi, useValue: { getTopics: () => of(CATALOG) } },
        { provide: Confirm, useValue: { ask: () => Promise.resolve(confirmAnswer) } },
      ],
    });
    navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    const fixture = TestBed.createComponent(EvaluationEditor);
    for (const [key, value] of Object.entries(inputs)) fixture.componentRef.setInput(key, value);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    const button = (text: string) =>
      [...el.querySelectorAll('button')].find((b) => b.textContent?.includes(text))!;
    const settle = async () => {
      await fixture.whenStable();
      await new Promise((r) => setTimeout(r));
      await fixture.whenStable();
    };
    return { fixture, el, button, settle };
  }

  it('al publicar algo incompleto lista lo que falta y no llama a la API', async () => {
    const { el, button, settle } = await render({ classId: 'c-1' });
    button('Publicar evaluación').click();
    await settle();
    const summary = el.querySelector('.form-problems')!;
    expect(summary.getAttribute('role')).toBe('alert');
    expect(summary.textContent).toContain('Escribe el nombre de la evaluación.');
    expect(summary.textContent).toContain('Elige el tema.');
    expect(api['publish']).not.toHaveBeenCalled();
  });

  it('elegir un tema muestra sus subtemas para marcar', async () => {
    const { el, fixture } = await render({ classId: 'c-1' });
    const select = el.querySelector<HTMLSelectElement>('#ev-topic')!;
    select.value = select.options[1].value;
    select.dispatchEvent(new Event('change'));
    await fixture.whenStable();

    const chips = [...el.querySelectorAll<HTMLButtonElement>('.subtopic')];
    expect(chips.map((c) => c.textContent?.trim())).toEqual([
      'Sumar fracciones',
      'Comparar fracciones',
    ]);
    chips[0].click();
    await fixture.whenStable();
    expect(chips[0].getAttribute('aria-pressed')).toBe('true');
  });

  it('el primer borrador se crea y pasa a la ruta de edición', async () => {
    const { el, button, settle } = await render({ classId: 'c-1' });
    const name = el.querySelector<HTMLInputElement>('#ev-name')!;
    name.value = 'Repaso';
    name.dispatchEvent(new Event('input'));
    button('Guardar borrador').click();
    await settle();
    expect(api['create']).toHaveBeenCalledWith('c-1', expect.objectContaining({ name: 'Repaso' }));
    expect(navigate).toHaveBeenCalledWith(
      ['/docente/evaluaciones', 'e-new', 'editar'],
      expect.objectContaining({ replaceUrl: true }),
    );
  });

  it('carga una evaluación existente con sus preguntas y el total de puntos', async () => {
    const { el } = await render({ evaluationId: 'e-1' });
    expect(el.querySelector<HTMLInputElement>('#ev-name')!.value).toBe('Fracciones – Unidad 3');
    expect(el.querySelector<HTMLSelectElement>('#ev-topic')!.disabled).toBe(true);
    expect(el.querySelectorAll('.question').length).toBe(1);
    expect(el.textContent).toContain('Total: 2 puntos');
  });

  it('no deja desmarcar un subtema que usa una pregunta', async () => {
    const { el, fixture } = await render({ evaluationId: 'e-1' });
    const sumar = el.querySelector<HTMLButtonElement>('.subtopic[aria-pressed="true"]')!;
    sumar.click();
    await fixture.whenStable();
    expect(sumar.getAttribute('aria-pressed')).toBe('true');
    expect(el.textContent).toContain('la pregunta 1 lo evalúa');
  });

  it('elimina una pregunta después de confirmar', async () => {
    const { el, settle } = await render({ evaluationId: 'e-1' });
    el.querySelector<HTMLButtonElement>('[aria-label="Eliminar pregunta 1"]')!.click();
    await settle();
    expect(api['deleteQuestion']).toHaveBeenCalledWith('e-1', 'q-1');
    expect(el.querySelectorAll('.question').length).toBe(0);
  });

  it('una evaluación que ya empezó no se puede editar', async () => {
    EXISTING.status = 'published';
    const { el } = await render({ evaluationId: 'e-1' });
    EXISTING.status = 'draft';
    expect(el.textContent).toContain('ya empezó');
    expect(el.querySelector('#ev-name')).toBeNull();
  });
});
