import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { filter, map } from 'rxjs';
import { Icon } from '../icon/icon';
import { Tone } from '../tone';
import { UserCard } from '../user-card/user-card';
import { Yoyo } from '../yoyo/yoyo';
import { NavItem } from './nav-item';

// Barra lateral de los dos portales. Bajo ~1100 px queda solo con íconos.
@Component({
  selector: 'ye-sidebar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, Icon, UserCard, Yoyo],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss',
})
export class Sidebar {
  private readonly router = inject(Router);

  readonly items = input.required<NavItem[]>();
  readonly userName = input.required<string>();
  readonly userDetail = input('');
  readonly userTone = input<Tone>('orange');
  readonly logout = output<void>();

  private readonly url = toSignal(
    this.router.events.pipe(
      filter((e) => e instanceof NavigationEnd),
      map(() => this.router.url),
    ),
    { initialValue: this.router.url },
  );

  protected isActive(item: NavItem): boolean {
    const url = this.url().split(/[?#]/)[0];
    return item.activeWhen ? item.activeWhen(url) : url.startsWith(item.path);
  }
}
