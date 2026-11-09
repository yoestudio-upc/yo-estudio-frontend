import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Injector,
  afterNextRender,
  computed,
  effect,
  inject,
  input,
  signal,
  untracked,
} from '@angular/core';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { firstValueFrom, map } from 'rxjs';
import { TeacherClassApi } from '../../../core/api/teacher-class.api';
import { loadedValue } from '../../../core/api/loaded-value';
import { TeacherEvaluationApi } from '../../../core/api/teacher-evaluation.api';
import {
  MAX_ACCEPTED,
  MAX_OPTIONS,
  MAX_POINTS,
  MIN_OPTIONS,
  OPTION_LETTERS,
  TRUE_FALSE_LABELS,
  questionProblems,
} from '../../../core/domain/question-rules';
import { HasUnsavedChanges } from '../../../core/layout/unsaved-changes.guard';
import { QuestionDraft, TeacherEvaluationDetail } from '../../../core/models/dto/teacher.dto';
import { QUESTION_TYPE_LABEL, QuestionType } from '../../../core/models/question';
import { classLabel } from '../../../shared/format/class-label';
import { Button } from '../../../shared/ui/button/button';
import { Card } from '../../../shared/ui/card/card';
import { Icon } from '../../../shared/ui/icon/icon';
import { PageHeader } from '../../../shared/ui/page-header/page-header';

// Qué significa cada tipo, debajo del selector
const TYPE_HINT: Record<QuestionType, string> = {
  single: 'Una sola opción es correcta.',
  truefalse: 'El estudiante elige entre Verdadero y Falso.',
  multiple: 'Puede haber varias correctas; cuenta bien solo si marca exactamente esas.',
  short: 'El estudiante escribe la respuesta. Se compara sin tildes, mayúsculas ni espacios.',
};

// D3 · Crear o editar una pregunta (HU13: cuatro tipos)
@Component({
  selector: 'ye-question-editor',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink, Button, Card, Icon, PageHeader],
  templateUrl: './question-editor.html',
  styleUrl: './question-editor.scss',
})
export class QuestionEditor implements HasUnsavedChanges {
  private readonly evaluationApi = inject(TeacherEvaluationApi);
  private readonly classApi = inject(TeacherClassApi);
  private readonly router = inject(Router);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);

  readonly evaluationId = input.required<string>();
  // Sin :questionId es una pregunta nueva
  readonly questionId = input<string>();

  protected readonly evaluation = rxResource({
    params: () => this.evaluationId(),
    stream: ({ params }) => this.evaluationApi.get(params),
  });
  protected readonly course = rxResource({
    params: () => loadedValue(this.evaluation)?.classId,
    stream: ({ params }) => this.classApi.getClass(params),
  });

  protected readonly letters = OPTION_LETTERS;
  protected readonly maxOptions = MAX_OPTIONS;
  protected readonly minOptions = MIN_OPTIONS;
  protected readonly maxPoints = MAX_POINTS;
  protected readonly maxAccepted = MAX_ACCEPTED;
  protected readonly types = Object.entries(QUESTION_TYPE_LABEL) as [QuestionType, string][];

  private readonly fb = inject(NonNullableFormBuilder);
  protected readonly form = this.fb.group({
    type: this.fb.control<QuestionType>('single'),
    subtopicId: this.fb.control<string | null>(null),
    text: [''],
    points: this.fb.control<number | null>(1),
    options: this.fb.array(Array.from({ length: MAX_OPTIONS }, () => this.option())),
    acceptedAnswers: this.fb.array([this.fb.control('')]),
  });
  private readonly value = toSignal(
    this.form.valueChanges.pipe(map(() => this.form.getRawValue())),
    { initialValue: this.form.getRawValue() },
  );

  protected readonly problems = signal<string[]>([]);
  protected readonly busy = signal(false);
  protected readonly notFound = signal(false);

  protected readonly questionType = computed(() => this.value().type);
  protected readonly typeHint = computed(() => TYPE_HINT[this.questionType()]);

  protected readonly locked = computed(() => {
    const status = this.evaluation.value()?.status;
    return status === 'published' || status === 'closed';
  });
  protected readonly subtopicOptions = computed(() => {
    const e = this.evaluation.value();
    return (e?.subtopics ?? []).map((s) => ({ id: s.id, label: `${e?.topic?.name} › ${s.name}` }));
  });
  protected readonly crumbs = computed(() => {
    const c = loadedValue(this.course);
    const e = loadedValue(this.evaluation);
    return [
      { label: c ? classLabel(c) : '', link: `/docente/cursos/${e?.classId}` },
      { label: e?.name ?? '', link: this.editorLink() },
      { label: this.questionId() ? 'Editar pregunta' : 'Nueva pregunta' },
    ];
  });
  // Vista previa "Así la verá el estudiante"
  protected readonly preview = computed(() => {
    const v = this.value();
    return {
      text: v.text.trim() || 'Aquí aparecerá el contenido de la pregunta.',
      options:
        v.type === 'short'
          ? []
          : v.options.map((o, i) => `${OPTION_LETTERS[i]}) ${o.text.trim() || '…'}`),
      note:
        v.type === 'short'
          ? 'Escribe tu respuesta: ________'
          : v.type === 'multiple'
            ? 'Puedes marcar varias respuestas.'
            : null,
    };
  });

  private loaded = false;

  constructor() {
    effect(() => {
      const e = loadedValue(this.evaluation);
      if (!e || this.loaded) return;
      untracked(() => this.load(e));
    });
  }

  hasUnsavedChanges(): boolean {
    return this.form.dirty;
  }

  // Solo cuando el docente cambia el tipo en el selector (no al cargar una pregunta)
  protected onTypeChange(): void {
    const type = this.form.controls.type.value;
    const options = this.form.controls.options;
    if (type === 'truefalse') {
      this.setOptions(TRUE_FALSE_LABELS.map((text) => ({ text, correct: false })));
    } else if (type !== 'short' && this.isTrueFalseOptions()) {
      // De verdadero o falso a opciones: vuelve a A–D vacías
      this.setOptions(Array.from({ length: MAX_OPTIONS }, () => ({ text: '', correct: false })));
    } else if (type === 'single' && options.value.filter((o) => o.correct).length > 1) {
      // De opción múltiple a única: solo puede quedar una correcta
      options.controls.forEach((g) => g.controls.correct.setValue(false));
    }
    if (type === 'short' && !this.form.controls.acceptedAnswers.length) this.addAccepted();
    this.form.markAsDirty();
  }

  protected isCorrect(index: number): boolean {
    return this.value().options[index]?.correct ?? false;
  }

  protected markCorrect(index: number): void {
    const groups = this.form.controls.options.controls;
    if (this.form.controls.type.value === 'multiple') {
      const control = groups[index].controls.correct;
      control.setValue(!control.value);
    } else {
      groups.forEach((group, i) => group.controls.correct.setValue(i === index));
    }
    this.form.markAsDirty();
  }

  protected addOption(): void {
    if (this.form.controls.options.length >= MAX_OPTIONS) return;
    this.form.controls.options.push(this.option());
    this.form.markAsDirty();
    this.focus(`#option-${this.form.controls.options.length - 1}`);
  }

  protected removeOption(index: number): void {
    if (this.form.controls.options.length <= MIN_OPTIONS) return;
    this.form.controls.options.removeAt(index);
    this.form.markAsDirty();
  }

  protected addAccepted(): void {
    if (this.form.controls.acceptedAnswers.length >= MAX_ACCEPTED) return;
    this.form.controls.acceptedAnswers.push(this.fb.control(''));
    this.form.markAsDirty();
    this.focus(`#accepted-${this.form.controls.acceptedAnswers.length - 1}`);
  }

  protected removeAccepted(index: number): void {
    if (this.form.controls.acceptedAnswers.length <= 1) return;
    this.form.controls.acceptedAnswers.removeAt(index);
    this.form.markAsDirty();
  }

  protected async save(): Promise<void> {
    if (this.busy()) return;
    const raw = this.form.getRawValue();
    const short = raw.type === 'short';
    const draft: QuestionDraft = {
      type: raw.type,
      subtopicId: raw.subtopicId,
      text: raw.text,
      points: raw.points,
      options: short ? [] : raw.options,
      acceptedAnswers: short ? raw.acceptedAnswers.map((a) => a.trim()).filter(Boolean) : [],
    };
    const allowed = this.subtopicOptions().map((s) => s.id);
    const problems = questionProblems(draft, allowed);
    if (problems.length) {
      this.showProblems(problems);
      return;
    }
    this.problems.set([]);
    this.busy.set(true);
    try {
      const questionId = this.questionId();
      await firstValueFrom(
        questionId
          ? this.evaluationApi.updateQuestion(this.evaluationId(), questionId, draft)
          : this.evaluationApi.addQuestion(this.evaluationId(), draft),
      );
      this.form.markAsPristine();
      void this.router.navigateByUrl(this.editorLink(), {
        state: { notice: 'Guardamos la pregunta.' },
      });
    } catch (error) {
      this.showProblems(
        error instanceof HttpErrorResponse && error.status === 422
          ? (error.error?.problems ?? ['Revisa los datos de la pregunta.'])
          : error instanceof HttpErrorResponse && error.status === 409
            ? ['Esta evaluación ya empezó, así que no se puede editar.']
            : ['No pudimos guardar. Revisa tu conexión e intenta otra vez.'],
      );
    } finally {
      this.busy.set(false);
    }
  }

  protected cancel(): void {
    void this.router.navigateByUrl(this.editorLink());
  }

  protected editorLink(): string {
    return `/docente/evaluaciones/${this.evaluationId()}/editar`;
  }

  private option() {
    return this.fb.group({ text: [''], correct: [false] });
  }

  private setOptions(values: { text: string; correct: boolean }[]): void {
    const options = this.form.controls.options;
    options.clear();
    values.forEach((v) => {
      const group = this.option();
      group.setValue(v);
      options.push(group);
    });
  }

  private isTrueFalseOptions(): boolean {
    const texts = this.form.controls.options.value.map((o) => o.text);
    return texts.length === 2 && texts.every((t, i) => t === TRUE_FALSE_LABELS[i]);
  }

  private load(e: TeacherEvaluationDetail): void {
    this.loaded = true;
    const questionId = this.questionId();
    if (!questionId) {
      // Si la evaluación tiene un solo subtema, ya queda elegido
      if (e.subtopics.length === 1) this.form.controls.subtopicId.setValue(e.subtopics[0].id);
      return;
    }
    const question = e.questions.find((q) => q.id === questionId);
    if (!question) {
      this.notFound.set(true);
      return;
    }
    const short = question.type === 'short';
    const options = short ? [] : question.options.map((o) => ({ text: o.text, correct: o.correct }));
    const accepted = short && question.acceptedAnswers.length ? question.acceptedAnswers : [''];
    this.setOptions(options);
    const answers = this.form.controls.acceptedAnswers;
    answers.clear();
    accepted.forEach(() => answers.push(this.fb.control('')));
    this.form.reset({
      type: question.type,
      subtopicId: question.subtopicId,
      text: question.text,
      points: question.points,
      options,
      acceptedAnswers: accepted,
    });
  }

  private focus(selector: string): void {
    afterNextRender(() => this.host.nativeElement.querySelector<HTMLElement>(selector)?.focus(), {
      injector: this.injector,
    });
  }

  private showProblems(problems: string[]): void {
    this.problems.set(problems);
    afterNextRender(
      () => this.host.nativeElement.querySelector<HTMLElement>('.form-problems')?.focus(),
      { injector: this.injector },
    );
  }
}
