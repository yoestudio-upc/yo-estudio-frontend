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
import { TagCatalogApi } from '../../../core/api/tag-catalog.api';
import { TeacherClassApi } from '../../../core/api/teacher-class.api';
import { TeacherEvaluationApi } from '../../../core/api/teacher-evaluation.api';
import { todayIso } from '../../../core/domain/calendar';
import { EvaluationCheck, evaluationProblems } from '../../../core/domain/evaluation-rules';
import { HasUnsavedChanges } from '../../../core/layout/unsaved-changes.guard';
import {
  EvaluationDraft,
  TeacherEvaluationDetail,
  TeacherQuestion,
} from '../../../core/models/dto/teacher.dto';
import { EvaluationStatus } from '../../../core/models/evaluation';
import { classLabel } from '../../../shared/format/class-label';
import { formatDateRange } from '../../../shared/format/dates';
import { topicStyle } from '../../../shared/topic/topic-style';
import { Button } from '../../../shared/ui/button/button';
import { Card } from '../../../shared/ui/card/card';
import { Chip } from '../../../shared/ui/chip/chip';
import { Confirm } from '../../../shared/ui/confirm-dialog/confirm-dialog';
import { Icon } from '../../../shared/ui/icon/icon';
import { PageHeader } from '../../../shared/ui/page-header/page-header';

// D2 · Crear o editar evaluación: un tema del catálogo, varios subtemas, fechas y preguntas
@Component({
  selector: 'ye-evaluation-editor',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink, Button, Card, Chip, Icon, PageHeader],
  templateUrl: './evaluation-editor.html',
  styleUrl: './evaluation-editor.scss',
})
export class EvaluationEditor implements HasUnsavedChanges {
  private readonly evaluationApi = inject(TeacherEvaluationApi);
  private readonly classApi = inject(TeacherClassApi);
  private readonly catalogApi = inject(TagCatalogApi);
  private readonly router = inject(Router);
  private readonly confirm = inject(Confirm);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);

  // Ruta "nueva" trae :classId; ruta "editar" trae :evaluationId
  readonly classId = input<string>();
  readonly evaluationId = input<string>();

  protected readonly evaluation = rxResource({
    params: () => this.evaluationId(),
    stream: ({ params }) => this.evaluationApi.get(params),
  });
  private readonly courseId = computed(() => this.classId() ?? this.evaluation.value()?.classId);
  protected readonly course = rxResource({
    params: () => this.courseId(),
    stream: ({ params }) => this.classApi.getClass(params),
  });
  protected readonly catalog = rxResource({
    params: () => this.course.value()?.subject,
    stream: ({ params }) => this.catalogApi.getTopics(params),
  });

  private readonly fb = inject(NonNullableFormBuilder);
  protected readonly form = this.fb.group({
    name: [''],
    topicId: this.fb.control<string | null>(null),
    subtopicIds: this.fb.control<string[]>([]),
    startDate: [''],
    endDate: [''],
    readingTitle: [''],
    readingText: [''],
  });
  private readonly value = toSignal(
    this.form.valueChanges.pipe(map(() => this.form.getRawValue())),
    { initialValue: this.form.getRawValue() },
  );

  protected readonly status = signal<EvaluationStatus | 'new'>('new');
  protected readonly savedId = signal<string | null>(null);
  protected readonly questions = signal<TeacherQuestion[]>([]);
  protected readonly problems = signal<string[]>([]);
  protected readonly hint = signal<string | null>(null);
  protected readonly busy = signal(false);
  protected readonly notice = signal<string | null>(
    (this.router.currentNavigation()?.extras.state?.['notice'] as string | undefined) ?? null,
  );

  protected readonly label = computed(() => {
    const c = this.course.value();
    return c ? classLabel(c) : '';
  });
  protected readonly locked = computed(
    () => this.status() === 'published' || this.status() === 'closed',
  );
  protected readonly isScheduled = computed(() => this.status() === 'scheduled');
  protected readonly topic = computed(() =>
    this.catalog.value()?.find((t) => t.id === this.value().topicId),
  );
  protected readonly tone = computed(() => topicStyle(this.topic()?.code).tone);
  // Subtemas conocidos: los del catálogo y los que ya trae la evaluación guardada
  private readonly knownSubtopics = computed(() => [
    ...(this.topic()?.subtopics ?? []),
    ...(this.evaluation.value()?.subtopics ?? []),
  ]);
  protected readonly subtopicName = computed(() => {
    const names = new Map(this.knownSubtopics().map((s) => [s.id, s.name]));
    return (id: string) => names.get(id) ?? '';
  });
  // Hasta tener curso y catálogo, el formulario no se puede usar
  protected readonly loading = computed(
    () =>
      (!!this.evaluationId() && this.evaluation.isLoading() && !this.savedId()) ||
      this.course.isLoading() ||
      this.catalog.isLoading(),
  );
  protected readonly totalPoints = computed(() =>
    this.questions().reduce((sum, q) => sum + q.points, 0),
  );
  protected readonly crumbs = computed(() => [
    { label: 'Cursos', link: '/docente/cursos' },
    { label: this.label(), link: `/docente/cursos/${this.courseId()}` },
    { label: this.evaluationId() ? this.value().name || 'Evaluación' : 'Nueva evaluación' },
  ]);

  // Evita que la carga de la evaluación pise lo que el docente ya escribió
  private loadedId: string | null = null;

  constructor() {
    effect(() => {
      const loaded = this.evaluation.value();
      if (!loaded || loaded.id === this.loadedId) return;
      untracked(() => this.load(loaded));
    });
    // Con preguntas creadas, el tema ya no se cambia (quedarían con subtemas de otro tema)
    effect(() => {
      const control = this.form.controls.topicId;
      if (this.questions().length) control.disable({ emitEvent: false });
      else control.enable({ emitEvent: false });
    });
  }

  hasUnsavedChanges(): boolean {
    return this.form.dirty;
  }

  protected isSelected(subtopicId: string): boolean {
    return this.value().subtopicIds.includes(subtopicId);
  }

  protected onTopicChange(): void {
    this.form.controls.subtopicIds.setValue([]);
    this.hint.set(null);
  }

  protected toggleSubtopic(subtopicId: string): void {
    const control = this.form.controls.subtopicIds;
    if (control.value.includes(subtopicId)) {
      const used = this.questions().findIndex((q) => q.subtopicId === subtopicId);
      if (used >= 0) {
        this.hint.set(
          `No puedes desmarcar «${this.subtopicName()(subtopicId)}»: la pregunta ${used + 1} lo evalúa.`,
        );
        return;
      }
      control.setValue(control.value.filter((id) => id !== subtopicId));
    } else {
      control.setValue([...control.value, subtopicId]);
    }
    control.markAsDirty();
    this.hint.set(null);
  }

  protected pointsLabel(points: number): string {
    return points === 1 ? '1 punto' : `${points} puntos`;
  }

  // Guardar borrador · o Guardar cambios si ya está programada
  protected async save(): Promise<void> {
    if (this.isScheduled()) {
      const saved = await this.persist('publish');
      if (saved) this.backToCourse(`Guardamos los cambios de «${saved.name}».`);
      return;
    }
    const wasNew = !this.savedId();
    const saved = await this.persist('draft');
    if (!saved) return;
    if (wasNew) {
      void this.router.navigate(['/docente/evaluaciones', saved.id, 'editar'], {
        replaceUrl: true,
        state: { notice: 'Guardamos el borrador.' },
      });
    } else {
      this.notice.set('Guardamos el borrador.');
    }
  }

  protected async publish(): Promise<void> {
    const saved = await this.persist('publish');
    if (!saved) return;
    this.busy.set(true);
    try {
      const published = await firstValueFrom(this.evaluationApi.publish(saved.id));
      const when =
        published.status === 'scheduled' && published.startDate && published.endDate
          ? `Los alumnos la verán: ${formatDateRange(published.startDate, published.endDate).toLowerCase()}.`
          : 'Los alumnos ya pueden resolverla.';
      this.backToCourse(`Publicaste «${published.name}». ${when}`);
    } catch (error) {
      this.showError(error);
    } finally {
      this.busy.set(false);
    }
  }

  // Crear o editar una pregunta: primero guarda lo escrito para no perderlo
  protected async goToQuestion(questionId?: string): Promise<void> {
    const saved = await this.persist(this.isScheduled() ? 'publish' : 'questions');
    if (!saved) return;
    void this.router.navigate([
      '/docente/evaluaciones',
      saved.id,
      'preguntas',
      questionId ?? 'nueva',
    ]);
  }

  protected async deleteQuestion(question: TeacherQuestion, index: number): Promise<void> {
    const ok = await this.confirm.ask({
      title: `¿Eliminar la pregunta ${index + 1}?`,
      message: `«${question.text}» se borrará de esta evaluación.`,
      confirmLabel: 'Eliminar',
      destructive: true,
    });
    const id = this.savedId();
    if (!ok || !id) return;
    this.busy.set(true);
    try {
      await firstValueFrom(this.evaluationApi.deleteQuestion(id, question.id));
      this.questions.update((list) => list.filter((q) => q.id !== question.id));
      this.notice.set(`Eliminamos la pregunta ${index + 1}.`);
    } catch (error) {
      this.showError(error);
    } finally {
      this.busy.set(false);
    }
  }

  protected cancel(): void {
    void this.router.navigate(['/docente/cursos', this.courseId()]);
  }

  private load(loaded: TeacherEvaluationDetail): void {
    this.loadedId = loaded.id;
    this.savedId.set(loaded.id);
    this.status.set(loaded.status);
    this.questions.set(loaded.questions);
    this.form.reset({
      name: loaded.name,
      topicId: loaded.topic?.id ?? null,
      subtopicIds: loaded.subtopics.map((s) => s.id),
      startDate: loaded.startDate ?? '',
      endDate: loaded.endDate ?? '',
      readingTitle: loaded.readingTitle ?? '',
      readingText: loaded.readingText ?? '',
    });
  }

  private draft(): EvaluationDraft {
    const v = this.form.getRawValue();
    return {
      name: v.name,
      topicId: v.topicId,
      subtopicIds: v.subtopicIds,
      startDate: v.startDate || null,
      endDate: v.endDate || null,
      readingTitle: v.readingTitle.trim() || null,
      readingText: v.readingText.trim() || null,
    };
  }

  // Valida, crea o actualiza. Devuelve lo guardado, o null si hubo problemas.
  private async persist(check: EvaluationCheck): Promise<TeacherEvaluationDetail | null> {
    if (this.busy()) return null;
    this.notice.set(null);
    const draft = this.draft();
    const problems = evaluationProblems(
      draft,
      this.questions(),
      check,
      this.knownSubtopics(),
      todayIso(),
    );
    if (problems.length) {
      this.showProblems(problems);
      return null;
    }
    this.problems.set([]);
    this.busy.set(true);
    try {
      const id = this.savedId();
      const saved = await firstValueFrom(
        id
          ? this.evaluationApi.update(id, draft)
          : this.evaluationApi.create(this.courseId()!, draft),
      );
      this.loadedId = saved.id;
      this.savedId.set(saved.id);
      this.status.set(saved.status);
      this.form.markAsPristine();
      return saved;
    } catch (error) {
      this.showError(error);
      return null;
    } finally {
      this.busy.set(false);
    }
  }

  private backToCourse(notice: string): void {
    this.form.markAsPristine();
    void this.router.navigate(['/docente/cursos', this.courseId()], { state: { notice } });
  }

  private showError(error: unknown): void {
    if (error instanceof HttpErrorResponse && error.status === 422) {
      this.showProblems(error.error?.problems ?? ['Revisa los datos de la evaluación.']);
    } else if (error instanceof HttpErrorResponse && error.status === 409) {
      this.showProblems(['Esta evaluación ya empezó, así que no se puede editar.']);
    } else {
      this.showProblems(['No pudimos guardar. Revisa tu conexión e intenta otra vez.']);
    }
  }

  // Muestra el resumen y lleva el foco a él para que se lea
  private showProblems(problems: string[]): void {
    this.problems.set(problems);
    afterNextRender(
      () => this.host.nativeElement.querySelector<HTMLElement>('.form-problems')?.focus(),
      { injector: this.injector },
    );
  }
}
