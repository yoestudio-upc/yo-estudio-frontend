import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type CardVariant =
  | 'default' // blanca con sombra sólida
  | 'soft' // gris azulado, dentro de otra tarjeta
  | 'highlight' // borde naranja: meta 1
  | 'goal' // amarilla: Tu meta
  | 'brand'; // azul: panel de Yoyo en el ingreso

export type CardRadius = 'md' | 'lg' | 'xl';

// Superficie de tarjeta sobre el elemento semántico que corresponda:
// <section yeCard>…</section>, <article yeCard variant="goal">…</article>
@Component({
  selector: '[yeCard]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content />',
  styleUrl: './card.scss',
  host: {
    '[class]': '"ye-card--" + variant() + " ye-card--r-" + radius()',
  },
})
export class Card {
  readonly variant = input<CardVariant>('default');
  readonly radius = input<CardRadius>('md');
}
