import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { StudentEvaluationApi } from '../../../core/api/student-evaluation.api';
import { TakeEvaluation as TakeData } from '../../../core/models/dto/student.dto';
import { Confirm } from '../../../shared/ui/confirm-dialog/confirm-dialog';
import { TakeEvaluation } from './take-evaluation';

const DATA: TakeData = {
  id: 'e-1',
  classId: 'c-1',
  name: 'Fracciones',
  endDate: '2026-10-30',
  readingTitle: 'La semilla de Lucía',
  readingText: 'Lucía sembró una semilla.',
  topic: { id: 't', code: 'fracciones', name: 'Fracciones' },
  subtopics: [{ id: 'st', code: 'sumar', name: 'Sumar fracciones' }],
  questions: [1, 2, 3].map((n) => ({
    id: `q${n}`,
    type: 'single' as const,
    subtopicId: 'st',
    text: `Pregunta número ${n}`,
    options: [
      { id: `q${n}-a`, text: '1/2' },
      { id: `q${n}-b`, text: '3/4' },
    ],
  })),
  progress: null,
};

describe('TakeEvaluation (04)', () => {
  let api: Record<string, ReturnType<typeof vi.fn>>;
  let navigate: ReturnType<typeof vi.fn>;
  let confirmAnswer: boolean;

  async function render(data: TakeData = DATA) {
    api = {
      getForTaking: vi.fn(() => of(structuredClone(data))),
      saveProgress: vi.fn(() => of(undefined)),
      sendTelemetry: vi.fn(() => of(undefined)),
      submit: vi.fn(() => of({})),
    };
    confirmAnswer = true;
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: StudentEvaluationApi, useValue: api },
        { provide: Confirm, useValue: { ask: vi.fn(() => Promise.resolve(confirmAnswer)) } },
      ],
    });
    navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    const fixture = TestBed.createComponent(TakeEvaluation);
    fixture.componentRef.setInput('evaluationId', 'e-1');
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    const settle = async () => {
      await fixture.whenStable();
      await new Promise((r) => setTimeout(r));
      await fixture.whenStable();
    };
    const button = (text: string) =>
      [...el.querySelectorAll('button')].find((b) => b.textContent?.includes(text))!;
    const mapLabels = () =>
      [...el.querySelectorAll('ye-question-map .dot')].map((d) => d.getAttribute('aria-label'));
    return { fixture, el, settle, button, mapLabels };
  }

  it('muestra la pregunta, el texto de lectura y "Pregunta 1 de 3", sin cronómetro', async () => {
    const { el } = await render();
    expect(el.querySelector('#question-text')?.textContent).toContain('Pregunta número 1');
    expect(el.querySelector('.reading summary')?.textContent).toContain('La semilla de Lucía');
    expect(el.textContent).toContain('Pregunta 1 de 3');
    expect(el.textContent).not.toMatch(/\d+:\d{2}/);
  });

  it('al elegir una opción la marca como "Elegida"', async () => {
    const { el, fixture } = await render();
    el.querySelectorAll<HTMLInputElement>('input[type="radio"]')[1].click();
    await fixture.whenStable();
    const chosen = el.querySelector('.option.chosen');
    expect(chosen?.textContent).toContain('3/4');
    expect(chosen?.textContent).toContain('Elegida');
  });

  it('"Dejar para después" avanza y la marca en el mapa', async () => {
    const { button, settle, el, mapLabels } = await render();
    button('Dejar para después').click();
    await settle();
    expect(el.textContent).toContain('Pregunta 2 de 3');
    expect(mapLabels()[0]).toBe('Pregunta 1, la dejaste para después');
    expect(mapLabels()[1]).toBe('Pregunta 2, es la actual');
  });

  it('terminar con preguntas sin responder pide confirmación', async () => {
    const { button, settle } = await render();
    confirmAnswer = false;
    button('Terminar evaluación').click();
    await settle();
    expect(TestBed.inject(Confirm).ask).toHaveBeenCalled();
    expect(api['submit']).not.toHaveBeenCalled();
  });

  it('al terminar envía telemetría y respuestas, y va al resultado', async () => {
    const { el, fixture, button, settle } = await render();
    el.querySelector<HTMLInputElement>('input[type="radio"]')!.click();
    await fixture.whenStable();
    button('Terminar evaluación').click();
    await settle();
    expect(api['sendTelemetry']).toHaveBeenCalled();
    expect(api['submit']).toHaveBeenCalledWith(
      'e-1',
      expect.objectContaining({ answers: { q1: 'q1-a' } }),
    );
    expect(navigate).toHaveBeenCalledWith(
      ['/estudiante/evaluaciones', 'e-1', 'resultado'],
      expect.objectContaining({ replaceUrl: true }),
    );
  });

  it('"Guardar y salir" guarda el avance y vuelve al curso', async () => {
    const { el, fixture, button, settle } = await render();
    el.querySelectorAll<HTMLInputElement>('input[type="radio"]')[1].click();
    await fixture.whenStable();
    button('Guardar y salir').click();
    await settle();
    expect(api['saveProgress']).toHaveBeenCalledWith('e-1', {
      answers: { q1: 'q1-b' },
      choices: {},
      texts: {},
      skipped: [],
      currentIndex: 0,
    });
    expect(navigate).toHaveBeenCalledWith(['/estudiante/cursos', 'c-1']);
  });

  it('retoma donde lo dejó', async () => {
    const { el } = await render({
      ...DATA,
      progress: { answers: { q1: 'q1-a' }, skipped: ['q2'], currentIndex: 2 },
    });
    expect(el.textContent).toContain('Pregunta 3 de 3');
  });

  it('salir por otro camino también guarda el avance', async () => {
    const { fixture } = await render();
    await fixture.componentInstance.beforeLeave();
    expect(api['saveProgress']).toHaveBeenCalled();
  });

  const MIXED: TakeData = {
    ...DATA,
    readingText: null,
    questions: [
      {
        id: 'm',
        type: 'multiple',
        subtopicId: 'st',
        text: 'Marca las equivalentes a 1/2',
        options: [
          { id: 'm-a', text: '2/4' },
          { id: 'm-b', text: '3/6' },
          { id: 'm-c', text: '1/3' },
        ],
      },
      { id: 's', type: 'short', subtopicId: 'st', text: 'Escribe 3/4 con palabras', options: [] },
    ],
  };

  it('opción múltiple: casillas que se marcan y desmarcan', async () => {
    const { el, fixture, settle, button } = await render(MIXED);
    expect(el.querySelector('legend')?.textContent).toContain('Puedes marcar varias');
    const boxes = () => [...el.querySelectorAll<HTMLInputElement>('input[type="checkbox"]')];
    boxes()[0].click();
    boxes()[1].click();
    boxes()[0].click();
    await fixture.whenStable();
    expect(boxes().map((b) => b.checked)).toEqual([false, true, false]);
    button('Siguiente').click();
    await settle();
    const input = el.querySelector<HTMLInputElement>('#short-answer')!;
    input.value = 'tres cuartos';
    input.dispatchEvent(new Event('input'));
    await fixture.whenStable();
    button('Terminar evaluación').click();
    await settle();
    expect(api['submit']).toHaveBeenCalledWith(
      'e-1',
      expect.objectContaining({ choices: { m: ['m-b'] }, texts: { s: 'tres cuartos' } }),
    );
  });

  it('respuesta corta: un campo de texto y sin opciones', async () => {
    const { el, fixture, button, settle } = await render(MIXED);
    button('Siguiente').click();
    await settle();
    expect(el.querySelector('#short-answer')).not.toBeNull();
    expect(el.querySelectorAll('.option').length).toBe(0);
    await fixture.whenStable();
  });

  it('una respuesta corta en blanco cuenta como sin responder', async () => {
    const { el, button, settle } = await render(MIXED);
    button('Siguiente').click();
    await settle();
    const input = el.querySelector<HTMLInputElement>('#short-answer')!;
    input.value = '   ';
    input.dispatchEvent(new Event('input'));
    button('Terminar evaluación').click();
    await settle();
    expect(TestBed.inject(Confirm).ask).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Te faltan 2 preguntas' }),
    );
  });
});
