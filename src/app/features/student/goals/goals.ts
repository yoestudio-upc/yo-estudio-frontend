import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { StudentProgressApi } from '../../../core/api/student-progress.api';
import { PracticeKind } from '../../../core/models/dto/student.dto';
import { topicStyle } from '../../../shared/topic/topic-style';
import { Button } from '../../../shared/ui/button/button';
import { Card } from '../../../shared/ui/card/card';
import { Icon } from '../../../shared/ui/icon/icon';
import { IconName } from '../../../shared/ui/icon/icons';
import { PageHeader } from '../../../shared/ui/page-header/page-header';
import { StarLevel } from '../../../shared/ui/star-level/star-level';

const PRACTICE_ICON: Record<PracticeKind, IconName> = {
  written: 'pencil',
  concrete: 'grid',
  reading: 'book',
};

// Metas visibles en fila (como el diseño); las demás van en una lista corta
const MAIN_GOALS = 3;

// 06 · Mis metas: salida del Componente 2. Orienta cómo practicar FUERA de la plataforma.
@Component({
  selector: 'ye-goals',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Button, Card, Icon, PageHeader, StarLevel],
  templateUrl: './goals.html',
  styleUrl: './goals.scss',
})
export class Goals {
  private readonly api = inject(StudentProgressApi);

  protected readonly goals = rxResource({ stream: () => this.api.getGoals() });

  private readonly all = computed(() =>
    (this.goals.value() ?? []).map((g) => ({
      ...g,
      style: topicStyle(g.topic.code),
      practiceIcon: PRACTICE_ICON[g.practice.kind],
    })),
  );
  protected readonly main = computed(() => this.all().slice(0, MAIN_GOALS));
  protected readonly later = computed(() => this.all().slice(MAIN_GOALS));
}
