import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, effect, inject, input } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { StudentClassApi } from '../../../core/api/student-class.api';
import { AuthService } from '../../../core/auth/auth.service';
import { todayIso } from '../../../core/domain/calendar';
import { LastCourse } from '../../../core/layout/last-course';
import { classLabel } from '../../../shared/format/class-label';
import { formatDueDate, formatLongDate } from '../../../shared/format/dates';
import { topicStyle } from '../../../shared/topic/topic-style';
import { Button } from '../../../shared/ui/button/button';
import { Card } from '../../../shared/ui/card/card';
import { Chip } from '../../../shared/ui/chip/chip';
import { Icon } from '../../../shared/ui/icon/icon';
import { PageHeader } from '../../../shared/ui/page-header/page-header';
import { StarLevel } from '../../../shared/ui/star-level/star-level';

// 03 · Evaluaciones del curso (estudiante)
@Component({
  selector: 'ye-class-evaluations',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, Button, Card, Chip, Icon, PageHeader, StarLevel],
  templateUrl: './class-evaluations.html',
  styleUrl: './class-evaluations.scss',
})
export class ClassEvaluations {
  private readonly api = inject(StudentClassApi);
  private readonly auth = inject(AuthService);

  readonly classId = input.required<string>();

  protected readonly overview = rxResource({
    params: () => this.classId(),
    stream: ({ params }) => this.api.getOverview(params),
  });

  protected readonly today = formatLongDate(todayIso());
  protected readonly greeting = computed(
    () => `¡Hola, ${this.auth.user()?.name.split(' ')[0] ?? ''}!`,
  );
  protected readonly label = computed(() => {
    const o = this.overview.value();
    return o ? classLabel(o.course) : '';
  });
  protected readonly subtitle = computed(() => {
    const count = this.overview.value()?.pending.length ?? 0;
    if (!count) return '¡Estás al día! No tienes evaluaciones por resolver.';
    return count === 1
      ? 'Tienes 1 evaluación por resolver en este curso.'
      : `Tienes ${count} evaluaciones por resolver en este curso.`;
  });
  protected readonly pending = computed(() =>
    (this.overview.value()?.pending ?? []).map((e) => ({
      ...e,
      style: topicStyle(e.topic.code),
      due: e.endDate ? formatDueDate(e.endDate) : '',
    })),
  );
  protected readonly notFound = computed(() => {
    const error = this.overview.error();
    return error instanceof HttpErrorResponse && error.status === 404;
  });

  constructor() {
    const lastCourse = inject(LastCourse);
    effect(() => lastCourse.remember(this.classId()));
  }
}
