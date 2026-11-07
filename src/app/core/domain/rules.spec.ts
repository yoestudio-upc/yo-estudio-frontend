import { EvaluationDraft, QuestionDraft } from '../models/dto/teacher.dto';
import { evaluationProblems } from './evaluation-rules';
import { questionProblems } from './question-rules';

describe('evaluationProblems', () => {
  const subtopics = [
    { id: 'st-sumar', code: 'sumar', name: 'Sumar fracciones' },
    { id: 'st-comparar', code: 'comparar', name: 'Comparar fracciones' },
  ];
  const complete: EvaluationDraft = {
    name: 'Fracciones',
    topicId: 't-fracciones',
    subtopicIds: ['st-sumar', 'st-comparar'],
    startDate: '2026-10-25',
    endDate: '2026-10-30',
    readingTitle: null,
    readingText: null,
  };
  const questions = [{ subtopicId: 'st-sumar' }, { subtopicId: 'st-comparar' }];
  const check = (
    d: Partial<EvaluationDraft>,
    q = questions,
    kind: 'draft' | 'questions' | 'publish' = 'publish',
  ) => evaluationProblems({ ...complete, ...d }, q, kind, subtopics, '2026-10-24');

  it('una evaluación completa se puede publicar', () => {
    expect(check({})).toEqual([]);
  });

  it('el borrador solo pide nombre', () => {
    expect(check({ name: ' ', topicId: null, subtopicIds: [] }, [], 'draft')).toEqual([
      'Escribe el nombre de la evaluación.',
    ]);
    expect(check({ topicId: null, startDate: null }, [], 'draft')).toEqual([]);
  });

  it('para crear preguntas hacen falta tema y subtemas', () => {
    expect(check({ topicId: null, subtopicIds: [] }, [], 'questions')).toEqual([
      'Elige el tema.',
      'Marca al menos un subtema.',
    ]);
  });

  it('revisa las fechas', () => {
    expect(check({ endDate: null })).toContain('Elige la fecha de inicio y la de fin.');
    expect(check({ endDate: '2026-10-20', startDate: '2026-10-22' })).toContain(
      'La fecha de fin debe ser igual o posterior a la de inicio.',
    );
    expect(check({ startDate: '2026-10-01', endDate: '2026-10-10' })).toContain(
      'La fecha de fin ya pasó.',
    );
  });

  it('cada subtema marcado necesita una pregunta', () => {
    expect(check({}, [{ subtopicId: 'st-sumar' }])).toEqual([
      'Falta al menos una pregunta de: Comparar fracciones.',
    ]);
    expect(check({}, [])).toContain('Agrega al menos una pregunta.');
  });

  it('avisa si una pregunta quedó con un subtema desmarcado', () => {
    expect(check({ subtopicIds: ['st-sumar'] })).toEqual([
      'La pregunta 2 evalúa un subtema que ya no está marcado.',
    ]);
  });
});

describe('questionProblems', () => {
  const valid: QuestionDraft = {
    type: 'single',
    subtopicId: 'st-sumar',
    text: '¿Cuánto es 1/4 + 2/4?',
    points: 2,
    options: [
      { text: '3/4', correct: true },
      { text: '3/8', correct: false },
    ],
  };
  const check = (d: Partial<QuestionDraft>) => questionProblems({ ...valid, ...d }, ['st-sumar']);

  it('una pregunta completa no tiene problemas', () => {
    expect(check({})).toEqual([]);
  });

  it('exige una sola opción correcta', () => {
    const none = valid.options.map((o) => ({ ...o, correct: false }));
    const both = valid.options.map((o) => ({ ...o, correct: true }));
    expect(check({ options: none })).toContain('Marca cuál es la opción correcta (solo una).');
    expect(check({ options: both })).toContain('Marca cuál es la opción correcta (solo una).');
  });

  it('valida subtema, contenido, puntos y opciones', () => {
    expect(check({ subtopicId: 'otro' })).toContain('Elige el subtema que evalúa.');
    expect(check({ text: '  ' })).toContain('Escribe el contenido de la pregunta.');
    expect(check({ points: 0 })).toContain('Los puntos deben ser un número entero del 1 al 10.');
    expect(check({ points: 1.5 })).toContain('Los puntos deben ser un número entero del 1 al 10.');
    expect(check({ options: [{ text: 'x', correct: true }] })).toContain(
      'Agrega al menos 2 opciones.',
    );
    expect(check({ options: [{ text: '', correct: true }, valid.options[1]] })).toContain(
      'Escribe el texto de todas las opciones.',
    );
  });
});
