import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { StudentEvaluationApi } from '../../../core/api/student-evaluation.api';
import { AuthService } from '../../../core/auth/auth.service';
import { LEVEL_CHEER } from '../../../core/models/level';
import { topicStyle } from '../../../shared/topic/topic-style';
import { Button } from '../../../shared/ui/button/button';
import { Card } from '../../../shared/ui/card/card';
import { Icon } from '../../../shared/ui/icon/icon';
import { StarLevel } from '../../../shared/ui/star-level/star-level';
import { Yoyo } from '../../../shared/ui/yoyo/yoyo';

// 05 · Evaluación terminada: resultado por subtema, siempre en positivo (sin riesgo)
@Component({
  selector: 'ye-evaluation-result',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, Button, Card, Icon, StarLevel, Yoyo],
  templateUrl: './result.html',
  styleUrl: './result.scss',
})
export class EvaluationResult {
  private readonly api = inject(StudentEvaluationApi);
  private readonly auth = inject(AuthService);

  readonly evaluationId = input.required<string>();

  protected readonly result = rxResource({
    params: () => this.evaluationId(),
    stream: ({ params }) => this.api.getResult(params),
  });

  protected readonly cheer = LEVEL_CHEER;
  protected readonly topicIcon = computed(() => topicStyle(this.result.value()?.topic.code).icon);

  // "Respondiste las 10 preguntas y acertaste 7. ¡Muy bien, Camila!"
  protected readonly summary = computed(() => {
    const r = this.result.value();
    if (!r) return '';
    const name = this.auth.user()?.name.split(' ')[0] ?? '';
    const answered =
      r.answeredCount === r.totalCount
        ? `Respondiste las ${r.totalCount} preguntas`
        : `Respondiste ${r.answeredCount} de ${r.totalCount} preguntas`;
    const cheer =
      r.correctCount * 2 >= r.totalCount
        ? `¡Muy bien, ${name}!`
        : `¡Gracias por tu esfuerzo, ${name}!`;
    return `${answered} y acertaste ${r.correctCount}. ${cheer}`;
  });
}
