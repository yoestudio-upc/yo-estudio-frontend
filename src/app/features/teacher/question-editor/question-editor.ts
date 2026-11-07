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
import { TeacherEvaluationApi } from '../../../core/api/teacher-evaluation.api';
import {
  MAX_OPTIONS,
  MAX_POINTS,
  MIN_OPTIONS,
  OPTION_LETTERS,
  questionProblems,
} from '../../../core/domain/question-rules';
import { HasUnsavedChanges } from '../../../core/layout/unsaved-changes.guard';
import { QuestionDraft, TeacherEvaluationDetail } from '../../../core/models/dto/teacher.dto';
import { classLabel } from '../../../shared/format/class-label';
import { Button } from '../../../shared/ui/button/button';
import { Card } from '../../../shared/ui/card/card';
import { Icon } from '../../../shared/ui/icon/icon';
import { PageHeader } from '../../../shared/ui/page-header/page-header';

// D3 · Crear o editar una pregunta de elección única
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
    params: () => this.evaluation.value()?.classId,
    stream: ({ params }) => this.classApi.getClass(params),
  });

  protected readonly letters = OPTION_LETTERS;
  protected readonly maxOptions = MAX_OPTIONS;
  protected readonly minOptions = MIN_OPTIONS;
  protected readonly maxPoints = MAX_POINTS;

  private readonly fb = inject(NonNullableFormBuilder);
  protected readonly form = this.fb.group({
    type: this.fb.control<'single'>('single'),
    subtopicId: this.fb.control<string | null>(null),
    text: [''],
    points: this.fb.control<number | null>(1),
    options: this.fb.array(Array.from({ length: MAX_OPTIONS }, () => this.option())),
  });
  private readonly value = toSignal(
    this.form.valueChanges.pipe(map(() => this.form.getRawValue())),
    { initialValue: this.form.getRawValue() },
  );

  protected readonly problems = signal<string[]>([]);
  protected readonly busy = signal(false);
  protected readonly notFound = signal(false);

  protected readonly locked = computed(() => {
    const status = this.evaluation.value()?.status;
    return status === 'published' || status === 'closed';
  });
  protected readonly subtopicOptions = computed(() => {
    const e = this.evaluation.value();
    return (e?.subtopics ?? []).map((s) => ({ id: s.id, label: `${e?.topic?.name} › ${s.name}` }));
  });
  protected readonly crumbs = computed(() => {
    const c = this.course.value();
    const e = this.evaluation.value();
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
      options: v.options.map((o, i) => `${OPTION_LETTERS[i]}) ${o.text.trim() || '…'}`),
    };
  });

  private loaded = false;

  constructor() {
    effect(() => {
      const e = this.evaluation.value();
      if (!e || this.loaded) return;
      untracked(() => this.load(e));
    });
  }

  hasUnsavedChanges(): boolean {
    return this.form.dirty;
  }

  protected isCorrect(index: number): boolean {
    return this.value().options[index]?.correct ?? false;
  }

  protected markCorrect(index: number): void {
    this.form.controls.options.controls.forEach((group, i) =>
      group.controls.correct.setValue(i === index),
    );
    this.form.markAsDirty();
  }

  protected addOption(): void {
    if (this.form.controls.options.length >= MAX_OPTIONS) return;
    this.form.controls.options.push(this.option());
    this.form.markAsDirty();
    const index = this.form.controls.options.length - 1;
    afterNextRender(
      () => this.host.nativeElement.querySelector<HTMLElement>(`#option-${index}`)?.focus(),
      { injector: this.injector },
    );
  }

  protected removeOption(index: number): void {
    if (this.form.controls.options.length <= MIN_OPTIONS) return;
    this.form.controls.options.removeAt(index);
    this.form.markAsDirty();
  }

  protected async save(): Promise<void> {
    if (this.busy()) return;
    const draft = this.form.getRawValue() as QuestionDraft;
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
    const options = this.form.controls.options;
    options.clear();
    question.options.forEach(() => options.push(this.option()));
    this.form.reset({
      type: question.type,
      subtopicId: question.subtopicId,
      text: question.text,
      points: question.points,
      options: question.options.map((o) => ({ text: o.text, correct: o.correct })),
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
