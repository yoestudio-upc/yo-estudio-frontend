import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type ButtonVariant =
  | 'primary' // azul con sombra 3D: ¡Entrar!, Siguiente
  | 'soft' // azul suave: Anterior, Buscar
  | 'outline' // borde azul: Ver resultados, Guardar borrador
  | 'white' // blanco sin borde: Cancelar, Ver mis metas
  | 'later' // naranja: Dejar para después
  | 'finish' // verde con sombra: Terminar evaluación
  | 'on-brand' // borde blanco sobre fondo azul
  | 'dashed'; // borde punteado: Agregar opción

export type ButtonSize = 'sm' | 'md' | 'lg';

// Se usa sobre elementos nativos para conservar su semántica:
// <button yeButton variant="primary">…</button>
@Component({
  selector: 'button[yeButton], a[yeButton]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content />',
  styleUrl: './button.scss',
  host: {
    '[class]': '"ye-btn--" + variant() + " ye-btn--" + size()',
    '[class.ye-btn--block]': 'block()',
  },
})
export class Button {
  readonly variant = input<ButtonVariant>('primary');
  readonly size = input<ButtonSize>('md');
  readonly block = input(false);
}
