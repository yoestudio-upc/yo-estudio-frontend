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
} from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { TeacherClassApi } from '../../../core/api/teacher-class.api';
import { TeacherEvaluationApi } from '../../../core/api/teacher-evaluation.api';
import { LastCourse } from '../../../core/layout/last-course';
import { TeacherEvaluationSummary } from '../../../core/models/dto/teacher.dto';
import { EvaluationStatus } from '../../../core/models/evaluation';
import { classLabel } from '../../../shared/format/class-label';
import { formatDateRange } from '../../../shared/format/dates';
import { topicStyle } from '../../../shared/topic/topic-style';
import { Avatar, rotatingTone } from '../../../shared/ui/avatar/avatar';
import { Button } from '../../../shared/ui/button/button';
import { Card } from '../../../shared/ui/card/card';
import { Icon } from '../../../shared/ui/icon/icon';
import { PageHeader } from '../../../shared/ui/page-header/page-header';
import { StatusBadge } from '../../../shared/ui/status-badge/status-badge';

const STATUS_ORDER: Record<EvaluationStatus, number> = {
  published: 0,
  scheduled: 1,
  draft: 2,
  closed: 3,
};

// Alumnos visibles antes de "Ver los N estudiantes"
const STUDENTS_PREVIEW = 8;

// D1 · Evaluaciones del curso (docente)
@Component({
  selector: 'ye-class-detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, RouterLink, Avatar, Button, Card, Icon, PageHeader, StatusBadge],
  templateUrl: './class-detail.html',
  styleUrl: './class-detail.scss',
})
export class ClassDetail {
  private readonly classApi = inject(TeacherClassApi);
  private readonly evaluationApi = inject(TeacherEvaluationApi);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);

  // Parámetro :classId de la ruta
  readonly classId = input.required<string>();

  constructor() {
    const lastCourse = inject(LastCourse);
    effect(() => lastCourse.remember(this.classId()));
  }

  protected readonly detail = rxResource({
    params: () => this.classId(),
    stream: ({ params }) => this.classApi.getClass(params),
  });
  protected readonly evaluations = rxResource({
    params: () => this.classId(),
    stream: ({ params }) => this.evaluationApi.listByClass(params),
  });

  protected readonly label = computed(() => {
    const c = this.detail.value();
    return c ? classLabel(c) : '';
  });
  protected readonly notFound = computed(() => {
    const error = this.detail.error();
    return error instanceof HttpErrorResponse && error.status === 404;
  });

  protected readonly rows = computed(() =>
    [...(this.evaluations.value() ?? [])]
      .sort(
        (a, b) =>
          STATUS_ORDER[a.status] - STATUS_ORDER[b.status] ||
          (b.startDate ?? '').localeCompare(a.startDate ?? ''),
      )
      .map((e) => ({ ...e, style: topicStyle(e.topic?.code), meta: this.meta(e) })),
  );

  // Aviso que deja D2 al publicar o guardar ("Publicaste «…»")
  protected readonly notice = signal<string | null>(
    (inject(Router).currentNavigation()?.extras.state?.['notice'] as string | undefined) ?? null,
  );

  protected readonly showAllStudents = signal(false);
  protected readonly students = computed(() => {
    const all = (this.detail.value()?.students ?? []).map((s, i) => ({
      ...s,
      tone: rotatingTone(i),
    }));
    return this.showAllStudents() ? all : all.slice(0, STUDENTS_PREVIEW);
  });
  protected readonly hasMoreStudents = computed(
    () => (this.detail.value()?.students.length ?? 0) > STUDENTS_PREVIEW,
  );

  // HU12 · Docentes del curso (por ahora solo se agregan)
  protected readonly teachers = computed(() =>
    (this.detail.value()?.teachers ?? []).map((t, i) => ({ ...t, tone: rotatingTone(i + 3) })),
  );
  protected readonly addingTeacher = signal(false);
  protected readonly teacherUsername = signal('');
  protected readonly teacherError = signal<string | null>(null);
  protected readonly teacherBusy = signal(false);

  protected openAddTeacher(): void {
    this.addingTeacher.set(true);
    this.teacherError.set(null);
    this.notice.set(null);
    this.focus('#teacher-username');
  }

  protected closeAddTeacher(): void {
    this.addingTeacher.set(false);
    this.teacherUsername.set('');
    this.teacherError.set(null);
    this.focus('.add-teacher-toggle');
  }

  protected async addTeacher(): Promise<void> {
    const username = this.teacherUsername().trim();
    if (!username) {
      this.teacherError.set('Escribe el usuario del docente.');
      return;
    }
    if (this.teacherBusy()) return;
    this.teacherBusy.set(true);
    this.teacherError.set(null);
    try {
      const added = await firstValueFrom(this.classApi.addTeacher(this.classId(), username));
      this.notice.set(`¡Listo! ${added.name} ahora es docente de este curso.`);
      this.addingTeacher.set(false);
      this.teacherUsername.set('');
      this.detail.reload();
    } catch (error) {
      const status = error instanceof HttpErrorResponse ? error.status : 0;
      const problems = error instanceof HttpErrorResponse ? error.error?.problems : null;
      this.teacherError.set(
        status === 404
          ? 'No encontramos a ese usuario. Revisa cómo se escribe.'
          : status === 409
            ? 'Ya es docente de este curso.'
            : status === 422
              ? (problems?.[0] ?? 'Revisa el usuario del docente.')
              : 'No pudimos agregarlo. Intenta otra vez.',
      );
    } finally {
      this.teacherBusy.set(false);
    }
  }

  private focus(selector: string): void {
    afterNextRender(() => this.host.nativeElement.querySelector<HTMLElement>(selector)?.focus(), {
      injector: this.injector,
    });
  }

  // "10 preguntas · Del 29 de septiembre al 3 de octubre · 18 de 26 la resolvieron"
  private meta(e: TeacherEvaluationSummary): string {
    const parts = [
      `${e.questionCount} ${e.questionCount === 1 ? 'pregunta' : 'preguntas'}`,
      e.startDate && e.endDate ? formatDateRange(e.startDate, e.endDate) : 'Sin fechas todavía',
    ];
    if (e.status === 'published' || e.status === 'closed') {
      parts.push(`${e.completedCount} de ${e.studentCount} la resolvieron`);
    }
    return parts.join(' · ');
  }
}
