import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  inject,
  linkedSignal,
} from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { loadedValue } from '../../../core/api/loaded-value';
import { StudentClassApi } from '../../../core/api/student-class.api';
import { StudentProgressApi } from '../../../core/api/student-progress.api';
import { LastCourse } from '../../../core/layout/last-course';
import { LEVEL_LABEL, Level } from '../../../core/models/level';
import { SUBJECT_STYLE, topicStyle } from '../../../shared/topic/topic-style';
import { Button } from '../../../shared/ui/button/button';
import { Card } from '../../../shared/ui/card/card';
import { Icon } from '../../../shared/ui/icon/icon';
import { PageHeader } from '../../../shared/ui/page-header/page-header';
import { StarLevel } from '../../../shared/ui/star-level/star-level';
import { Yoyo } from '../../../shared/ui/yoyo/yoyo';

// 07 · Mi avance (OLM): niveles por tema y subtema, y el perfil de respuesta en positivo
@Component({
  selector: 'ye-progress',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Button, Card, Icon, PageHeader, StarLevel, Yoyo],
  templateUrl: './progress.html',
  styleUrl: './progress.scss',
})
export class Progress {
  private readonly classApi = inject(StudentClassApi);
  private readonly progressApi = inject(StudentProgressApi);
  private readonly lastCourse = inject(LastCourse);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  protected readonly classes = rxResource({ stream: () => this.classApi.getMyClasses() });

  // Curso elegido: el último abierto si está en la lista; si no, el primero
  protected readonly selected = linkedSignal(() => {
    const list = loadedValue(this.classes) ?? [];
    const last = this.lastCourse.id();
    return list.find((c) => c.id === last)?.id ?? list[0]?.id ?? null;
  });

  protected readonly progress = rxResource({
    params: () => this.selected() ?? undefined,
    stream: ({ params }) => this.progressApi.getProgress(params),
  });

  // Las pestañas están fuera del bloque de error: si los cursos no cargan, no hay pestañas
  protected readonly tabs = computed(() =>
    (loadedValue(this.classes) ?? []).map((c) => ({
      id: c.id,
      label: c.name,
      tone: SUBJECT_STYLE[c.subject].tone,
    })),
  );
  protected readonly topics = computed(() =>
    (this.progress.value()?.topics ?? []).map((t) => ({
      ...t,
      style: topicStyle(t.topic.code),
      percent: t.subtopics.length ? (t.achieved / t.subtopics.length) * 100 : 0,
    })),
  );
  protected readonly levels: Level[] = [1, 2, 3];
  protected readonly levelLabel = LEVEL_LABEL;
  protected readonly legend: Record<Level, string> = {
    1: 'lo estás conociendo',
    2: '¡ya casi!',
    3: 'ya lo dominas',
  };

  // Si fallaron los cursos, se vuelven a pedir (sin cursos no hay avance que pedir)
  protected retry(): void {
    if (this.classes.error()) this.classes.reload();
    else this.progress.reload();
  }

  protected select(id: string): void {
    this.selected.set(id);
    this.lastCourse.remember(id);
  }

  // Pestañas con flechas izquierda/derecha (patrón ARIA de tabs)
  protected onTabKey(event: KeyboardEvent, index: number): void {
    const tabs = this.tabs();
    const delta = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
    if (!delta || !tabs.length) return;
    event.preventDefault();
    const next = tabs[(index + delta + tabs.length) % tabs.length];
    this.select(next.id);
    this.host.nativeElement.querySelector<HTMLElement>(`#tab-${next.id}`)?.focus();
  }
}
