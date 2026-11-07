import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
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
  imports: [RouterLink, Avatar, Button, Card, Icon, PageHeader, StatusBadge],
  templateUrl: './class-detail.html',
  styleUrl: './class-detail.scss',
})
export class ClassDetail {
  private readonly classApi = inject(TeacherClassApi);
  private readonly evaluationApi = inject(TeacherEvaluationApi);

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
