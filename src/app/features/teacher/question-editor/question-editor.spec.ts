import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { TeacherClassApi } from '../../../core/api/teacher-class.api';
import { TeacherEvaluationApi } from '../../../core/api/teacher-evaluation.api';
import { TeacherEvaluationDetail } from '../../../core/models/dto/teacher.dto';
import { QuestionEditor } from './question-editor';

const EVALUATION: TeacherEvaluationDetail = {
  id: 'e-1',
  classId: 'c-1',
  name: 'Fracciones – Unidad 3',
  status: 'draft',
  startDate: null,
  endDate: null,
  readingTitle: null,
  readingText: null,
  topic: { id: 'tag-fracciones', code: 'fracciones', name: 'Fracciones' },
  subtopics: [
    { id: 'st-sumar', code: 'sumar', name: 'Sumar fracciones' },
    { id: 'st-comparar', code: 'comparar', name: 'Comparar fracciones' },
  ],
  questions: [
    {
      id: 'q-1',
      type: 'single',
      acceptedAnswers: [],
      subtopicId: 'st-comparar',
      text: '¿Cuál es mayor?',
      points: 1,
      options: [
        { id: 'o1', text: '3/5', correct: true },
        { id: 'o2', text: '2/5', correct: false },
        { id: 'o3', text: 'Son iguales', correct: false },
      ],
    },
  ],
};

describe('QuestionEditor (D3)', () => {
  let api: Record<string, ReturnType<typeof vi.fn>>;
  let navigate: ReturnType<typeof vi.fn>;

  async function render(questionId?: string) {
    api = {
      get: vi.fn(() => of(structuredClone(EVALUATION))),
      addQuestion: vi.fn(() => of({})),
      updateQuestion: vi.fn(() => of({})),
    };
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: TeacherEvaluationApi, useValue: api },
        {
          provide: TeacherClassApi,
          useValue: {
            getClass: () => of({ id: 'c-1', name: 'Matemática', grade: 4, section: 'B' }),
          },
        },
      ],
    });
    navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    const fixture = TestBed.createComponent(QuestionEditor);
    fixture.componentRef.setInput('evaluationId', 'e-1');
    if (questionId) fixture.componentRef.setInput('questionId', questionId);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    const type = (selector: string, value: string) => {
      const input = el.querySelector<HTMLInputElement>(selector)!;
      input.value = value;
      input.dispatchEvent(new Event('input'));
    };
    const settle = async () => {
      await fixture.whenStable();
      await new Promise((r) => setTimeout(r));
      await fixture.whenStable();
    };
    const submit = async () => {
      el.querySelector<HTMLFormElement>('form')!.dispatchEvent(new Event('submit'));
      await settle();
    };
    return { fixture, el, type, submit };
  }

  it('empieza con las opciones A–D y solo los subtemas de la evaluación', async () => {
    const { el } = await render();
    expect(el.querySelectorAll('.option').length).toBe(4);
    const subtopics = [...el.querySelectorAll('#q-subtopic option')].map((o) =>
      o.textContent?.trim(),
    );
    expect(subtopics).toEqual([
      'Elige un subtema',
      'Fracciones › Sumar fracciones',
      'Fracciones › Comparar fracciones',
    ]);
  });

  it('solo una opción queda marcada como correcta', async () => {
    const { el, fixture } = await render();
    const marks = () => [...el.querySelectorAll<HTMLButtonElement>('.mark')];
    marks()[1].click();
    await fixture.whenStable();
    marks()[2].click();
    await fixture.whenStable();
    expect(marks().map((m) => m.getAttribute('aria-pressed'))).toEqual([
      'false',
      'false',
      'true',
      'false',
    ]);
  });

  it('con datos incompletos muestra el resumen y no guarda', async () => {
    const { el, submit } = await render();
    await submit();
    expect(el.querySelector('.form-problems')?.textContent).toContain(
      'Elige el subtema que evalúa.',
    );
    expect(api['addQuestion']).not.toHaveBeenCalled();
  });

  it('guarda una pregunta completa y vuelve a la evaluación', async () => {
    const { el, fixture, type, submit } = await render();
    const select = el.querySelector<HTMLSelectElement>('#q-subtopic')!;
    select.value = select.options[1].value;
    select.dispatchEvent(new Event('change'));
    type('#q-text', '¿Cuánto es 1/4 + 2/4?');
    // Deja solo dos opciones
    el.querySelector<HTMLButtonElement>('[aria-label="Eliminar opción D"]')!.click();
    el.querySelector<HTMLButtonElement>('[aria-label="Eliminar opción C"]')!.click();
    await fixture.whenStable();
    type('#option-0', '3/4');
    type('#option-1', '3/8');
    el.querySelectorAll<HTMLButtonElement>('.mark')[0].click();
    await submit();

    expect(api['addQuestion']).toHaveBeenCalledWith('e-1', {
      type: 'single',
      acceptedAnswers: [],
      subtopicId: 'st-sumar',
      text: '¿Cuánto es 1/4 + 2/4?',
      points: 1,
      options: [
        { text: '3/4', correct: true },
        { text: '3/8', correct: false },
      ],
    });
    expect(navigate).toHaveBeenCalledWith('/docente/evaluaciones/e-1/editar', expect.anything());
  });

  it('al editar carga la pregunta y la vista previa', async () => {
    const { el } = await render('q-1');
    expect(el.querySelectorAll('.option').length).toBe(3);
    expect(el.querySelector<HTMLInputElement>('#option-2')!.value).toBe('Son iguales');
    expect(el.querySelector('.preview')?.textContent).toContain('A) 3/5');
    expect(el.querySelector('.mark[aria-pressed="true"]')?.textContent).toContain('Correcta');
  });

  async function chooseType(el: HTMLElement, fixture: { whenStable(): Promise<unknown> }, value: string) {
    const select = el.querySelector<HTMLSelectElement>('#q-type')!;
    select.value = value;
    select.dispatchEvent(new Event('change'));
    await fixture.whenStable();
  }

  it('ofrece los cuatro tipos de pregunta', async () => {
    const { el } = await render();
    expect([...el.querySelectorAll('#q-type option')].map((o) => o.textContent?.trim())).toEqual([
      'Elección única',
      'Verdadero o falso',
      'Opción múltiple',
      'Respuesta corta',
    ]);
  });

  it('verdadero o falso: dos opciones fijas y una correcta', async () => {
    const { el, fixture } = await render();
    await chooseType(el, fixture, 'truefalse');
    const inputs = [...el.querySelectorAll<HTMLInputElement>('.option input')];
    expect(inputs.map((i) => i.value)).toEqual(['Verdadero', 'Falso']);
    expect(inputs.every((i) => i.readOnly)).toBe(true);
    expect(el.querySelector('[aria-label^="Eliminar opción"]')).toBeNull();
  });

  it('opción múltiple deja marcar varias correctas', async () => {
    const { el, fixture } = await render();
    await chooseType(el, fixture, 'multiple');
    const marks = () => [...el.querySelectorAll<HTMLButtonElement>('.mark')];
    marks()[0].click();
    marks()[2].click();
    await fixture.whenStable();
    expect(marks().map((m) => m.getAttribute('aria-pressed'))).toEqual(['true', 'false', 'true', 'false']);
  });

  it('respuesta corta guarda las respuestas aceptadas y ninguna opción', async () => {
    const { el, fixture, type, submit } = await render();
    await chooseType(el, fixture, 'short');
    const select = el.querySelector<HTMLSelectElement>('#q-subtopic')!;
    select.value = select.options[1].value;
    select.dispatchEvent(new Event('change'));
    type('#q-text', 'Escribe 3/4 con palabras');
    type('#accepted-0', 'tres cuartos');
    el.querySelector<HTMLButtonElement>('button.add')!.click();
    await fixture.whenStable();
    type('#accepted-1', ' 3/4 ');
    await submit();
    expect(api['addQuestion']).toHaveBeenCalledWith('e-1', {
      type: 'short',
      subtopicId: 'st-sumar',
      text: 'Escribe 3/4 con palabras',
      points: 1,
      options: [],
      acceptedAnswers: ['tres cuartos', '3/4'],
    });
  });
});
