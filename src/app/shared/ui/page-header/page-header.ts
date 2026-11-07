import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Yoyo, YoyoPose } from '../yoyo/yoyo';

export interface Crumb {
  label: string;
  link?: string;
}

// Encabezado de pantalla: con Yoyo va en tarjeta (Cursos); sin Yoyo, plano (D1).
// Lo proyectado con [headerAside] va a la derecha.
@Component({
  selector: 'ye-page-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, Yoyo],
  templateUrl: './page-header.html',
  styleUrl: './page-header.scss',
  host: { '[class.card]': '!!yoyo()' },
})
export class PageHeader {
  readonly heading = input.required<string>();
  readonly subtitle = input<string>();
  readonly crumbs = input<Crumb[]>([]);
  readonly yoyo = input<YoyoPose | null>(null);
}
