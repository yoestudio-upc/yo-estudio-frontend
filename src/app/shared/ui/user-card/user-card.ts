import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Avatar } from '../avatar/avatar';
import { Tone } from '../tone';

// Avatar con iniciales + nombre + detalle (grado o "Docente")
@Component({
  selector: 'ye-user-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Avatar],
  template: `
    <ye-avatar [name]="name()" [tone]="tone()" />
    <span class="text">
      <span class="name">{{ name() }}</span>
      <span class="detail">{{ detail() }}</span>
    </span>
  `,
  styleUrl: './user-card.scss',
})
export class UserCard {
  readonly name = input.required<string>();
  readonly detail = input('');
  readonly tone = input<Tone>('orange');
}
