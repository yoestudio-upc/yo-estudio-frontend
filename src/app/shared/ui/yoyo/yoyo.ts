import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type YoyoPose =
  | 'wave' // saluda con un ala: ingreso y encabezados
  | 'calm' // alas abajo: mientras rinde la evaluación
  | 'look' // mira hacia el contenido: Mis metas
  | 'thinking' // párpados a medias: perfil "Tu forma de responder"
  | 'happy' // ojos felices y confeti: evaluación terminada
  | 'mark'; // versión simple para el logo

// Mascota decorativa: el mensaje de Yoyo siempre va como texto aparte
@Component({
  selector: 'ye-yoyo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './yoyo.html',
  styleUrl: './yoyo.scss',
  host: {
    'aria-hidden': 'true',
    // --yoyo-size en CSS permite achicarlo según el ancho de pantalla
    '[style.width]': '"var(--yoyo-size, " + size() + "px)"',
  },
})
export class Yoyo {
  readonly pose = input<YoyoPose>('wave');
  // Ancho en px; el alto sale de la proporción del dibujo
  readonly size = input(120);

  protected readonly happy = computed(() => this.pose() === 'happy');
  protected readonly viewBox = computed(() => (this.happy() ? '-10 -6 140 132' : '0 0 120 126'));
  protected readonly height = computed(() =>
    Math.round(this.size() * (this.happy() ? 132 / 140 : 126 / 120)),
  );
  protected readonly raisedWing = computed(() => ['wave', 'look', 'happy'].includes(this.pose()));
  protected readonly pupils = computed(() => {
    switch (this.pose()) {
      case 'look':
        return { left: [47, 55], right: [79, 55], shine: true };
      case 'thinking':
        return { left: [45, 58], right: [75, 58], shine: false };
      default:
        return { left: [45, 56], right: [75, 56], shine: this.pose() !== 'mark' };
    }
  });
}
