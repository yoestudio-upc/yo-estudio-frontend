import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

export type QuestionState = 'answered' | 'later' | 'unseen';

const STATE_LABEL: Record<QuestionState, string> = {
  answered: 'ya la respondiste',
  later: 'la dejaste para después',
  unseen: 'todavía no la ves',
};

// Mapa "Tus preguntas" de la pantalla 04: estado de cada pregunta y salto directo
@Component({
  selector: 'ye-question-map',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h2 id="map-title">Tus preguntas</h2>
    <ol class="grid" role="list" aria-labelledby="map-title">
      @for (state of states(); track $index; let i = $index) {
        <li>
          <button
            type="button"
            [class]="'dot ' + state"
            [class.current]="i === current()"
            [attr.aria-current]="i === current() ? 'step' : null"
            [attr.aria-label]="label(i, state)"
            (click)="select.emit(i)"
          >
            {{ i + 1 }}
          </button>
        </li>
      }
    </ol>
    <ul class="legend" role="list" aria-label="Qué significa cada color">
      <li><span class="key answered" aria-hidden="true"></span>Ya la respondí</li>
      <li><span class="key later" aria-hidden="true"></span>La dejé para después</li>
      <li><span class="key unseen" aria-hidden="true"></span>Todavía no la veo</li>
    </ul>
  `,
  styleUrl: './question-map.scss',
})
export class QuestionMap {
  readonly states = input.required<QuestionState[]>();
  readonly current = input.required<number>();
  readonly select = output<number>();

  protected label(index: number, state: QuestionState): string {
    if (index === this.current()) {
      const done = state === 'answered' ? ', ya la respondiste' : '';
      return `Pregunta ${index + 1}, es la actual${done}`;
    }
    return `Pregunta ${index + 1}, ${STATE_LABEL[state]}`;
  }
}
