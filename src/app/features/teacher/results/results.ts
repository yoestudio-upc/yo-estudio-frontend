import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  linkedSignal,
  signal,
} from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { TeacherReportsApi } from '../../../core/api/teacher-reports.api';
import { StudentDiagnostic } from '../../../core/models/dto/teacher.dto';
import { TEACHER_LEVEL_LABEL } from '../../../core/models/level';
import { classLabel } from '../../../shared/format/class-label';
import { topicStyle } from '../../../shared/topic/topic-style';
import { Avatar, rotatingTone } from '../../../shared/ui/avatar/avatar';
import { Button } from '../../../shared/ui/button/button';
import { Card } from '../../../shared/ui/card/card';
import { Icon } from '../../../shared/ui/icon/icon';
import { PageHeader } from '../../../shared/ui/page-header/page-header';
import { StarLevel } from '../../../shared/ui/star-level/star-level';
import { StatusBadge } from '../../../shared/ui/status-badge/status-badge';

type Filter = 'all' | 'risk' | 'pending';

// Quien está en riesgo va primero; sin predicción, después de los demás
const riskOrder = (s: StudentDiagnostic): number =>
  !s.prediction ? 2 : s.prediction.atRisk ? 0 : 1;

// D4 · Resultados por alumno (HU04, HU08, HU11). Única pantalla con riesgo y SHAP;
// vive solo en el portal docente (regla 1). Diseño propio: no había mockup.
@Component({
  selector: 'ye-evaluation-results',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, Avatar, Button, Card, Icon, PageHeader, StarLevel, StatusBadge],
  templateUrl: './results.html',
  styleUrl: './results.scss',
})
export class EvaluationResults {
  private readonly api = inject(TeacherReportsApi);

  readonly evaluationId = input.required<string>();

  protected readonly report = rxResource({
    params: () => this.evaluationId(),
    stream: ({ params }) => this.api.getResults(params),
  });

  protected readonly levelLabel = TEACHER_LEVEL_LABEL;
  protected readonly riskLabel = (atRisk: boolean): string =>
    atRisk ? 'En riesgo' : 'Sin riesgo';
  protected readonly riskClass = (atRisk: boolean): string =>
    atRisk ? 'risk risk--high' : 'risk risk--low';
  protected readonly filter = signal<Filter>('all');

  protected readonly label = computed(() => {
    const r = this.report.value();
    return r ? classLabel(r.course) : '';
  });
  protected readonly topicIcon = computed(
    () => topicStyle(this.report.value()?.evaluation.topic.code).icon,
  );

  // En riesgo primero; los que no la rindieron, al final
  private readonly sorted = computed(() =>
    (this.report.value()?.students ?? [])
      .map((s, i) => ({ ...s, tone: rotatingTone(i) }))
      .sort((a, b) => {
        if (a.done !== b.done) return a.done ? -1 : 1;
        return riskOrder(a) - riskOrder(b) || a.name.localeCompare(b.name);
      }),
  );

  protected readonly counts = computed(() => {
    const all = this.sorted();
    const done = all.filter((s) => s.done);
    return {
      all: all.length,
      done: done.length,
      pending: all.length - done.length,
      atRisk: done.filter((s) => s.prediction?.atRisk).length,
      achieved: done.filter((s) => s.topicLevel === 3).length,
      average: done.length
        ? Math.round((done.reduce((sum, s) => sum + (s.correctCount ?? 0), 0) / done.length) * 10) /
          10
        : 0,
    };
  });

  protected readonly rows = computed(() => {
    const f = this.filter();
    return this.sorted().filter((s) =>
      f === 'risk' ? s.prediction?.atRisk : f === 'pending' ? !s.done : true,
    );
  });

  // Alumno elegido: por defecto el primero de la lista
  protected readonly selectedId = linkedSignal(() => this.sorted()[0]?.studentId ?? null);
  protected readonly selected = computed(() =>
    this.sorted().find((s) => s.studentId === this.selectedId()),
  );

  // Barras SHAP: tamaño relativo al factor más fuerte del alumno
  protected readonly factors = computed(() => {
    const factors = this.selected()?.factors ?? [];
    const max = Math.max(...factors.map((f) => Math.abs(f.weight)), 0.0001);
    return factors.map((f) => ({
      ...f,
      raises: f.weight < 0,
      percent: Math.round((Math.abs(f.weight) / max) * 100),
    }));
  });

  protected select(student: StudentDiagnostic): void {
    this.selectedId.set(student.studentId);
  }
}
