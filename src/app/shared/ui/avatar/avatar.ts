import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { Tone } from '../tone';

// Círculo con iniciales. Decorativo: el nombre siempre va como texto al lado.
@Component({
  selector: 'ye-avatar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '{{ initials() }}',
  styleUrl: './avatar.scss',
  host: {
    'aria-hidden': 'true',
    '[class]': '"tone-" + tone() + " size-" + size()',
  },
})
export class Avatar {
  readonly name = input.required<string>();
  readonly tone = input<Tone>('orange');
  readonly size = input<'sm' | 'md'>('md');

  protected readonly initials = computed(() =>
    this.name()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word[0].toUpperCase())
      .join(''),
  );
}

// Tono rotativo para listas de alumnos (como en el diseño)
const ROTATION: Tone[] = ['orange', 'blue', 'green', 'yellow'];
export function rotatingTone(index: number): Tone {
  return ROTATION[index % ROTATION.length];
}
