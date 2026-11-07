import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { NavItem } from '../../../shared/ui/sidebar/nav-item';
import { Tone } from '../../../shared/ui/tone';
import { Sidebar } from '../../../shared/ui/sidebar/sidebar';
import { AuthService } from '../../auth/auth.service';
import { LOGIN_PATH } from '../../auth/role-home';

// Marco de los portales con barra lateral. El menú llega por `data.nav` de la ruta.
@Component({
  selector: 'ye-shell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, Sidebar],
  templateUrl: './shell.html',
  styleUrl: './shell.scss',
})
export class Shell {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly nav = input.required<NavItem[]>();

  protected readonly userName = computed(() => this.auth.user()?.name ?? '');
  protected readonly userDetail = computed(() => {
    const user = this.auth.user();
    if (this.auth.role() === 'docente') return 'Docente';
    return user?.grade ? `${user.grade}.° grado ${user.section ?? ''}`.trim() : '';
  });
  protected readonly userTone = computed<Tone>(() =>
    this.auth.role() === 'docente' ? 'green' : 'orange',
  );

  // Con <base href="/"> un enlace #ancla recargaría la app: se mueve el foco a mano
  protected skipToContent(event: Event, main: HTMLElement): void {
    event.preventDefault();
    main.focus();
  }

  protected logout(): void {
    this.auth.logout();
    void this.router.navigateByUrl(LOGIN_PATH);
  }
}
