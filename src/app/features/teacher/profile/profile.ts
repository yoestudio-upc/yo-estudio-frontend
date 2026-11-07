import { ChangeDetectionStrategy, Component, Injector, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { MockDb } from '../../../core/api/mock/mock-db';
import { TeacherClassApi } from '../../../core/api/teacher-class.api';
import { AuthService } from '../../../core/auth/auth.service';
import { LOGIN_PATH } from '../../../core/auth/role-home';
import { classLabel } from '../../../shared/format/class-label';
import { Avatar } from '../../../shared/ui/avatar/avatar';
import { Button } from '../../../shared/ui/button/button';
import { Card } from '../../../shared/ui/card/card';
import { Confirm } from '../../../shared/ui/confirm-dialog/confirm-dialog';
import { Icon } from '../../../shared/ui/icon/icon';
import { PageHeader } from '../../../shared/ui/page-header/page-header';

// Perfil del docente (sin diseño previo): datos básicos, sus cursos y salir
@Component({
  selector: 'ye-teacher-profile',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, Avatar, Button, Card, Icon, PageHeader],
  templateUrl: './profile.html',
  styleUrl: './profile.scss',
})
export class TeacherProfile {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly confirm = inject(Confirm);
  private readonly injector = inject(Injector);
  private readonly classApi = inject(TeacherClassApi);

  protected readonly user = this.auth.user;
  protected readonly classes = rxResource({ stream: () => this.classApi.getMyClasses() });
  protected readonly label = classLabel;
  // Herramienta de las sesiones de prueba: solo existe mientras se usan mocks
  protected readonly demo = environment.useMocks;

  protected logout(): void {
    this.auth.logout();
    void this.router.navigateByUrl(LOGIN_PATH);
  }

  protected async resetDemo(): Promise<void> {
    const ok = await this.confirm.ask({
      title: '¿Restablecer los datos de ejemplo?',
      message:
        'Se borran las evaluaciones, respuestas y cursos que se crearon en este navegador, y vuelven los datos iniciales.',
      confirmLabel: 'Restablecer',
      destructive: true,
    });
    if (!ok) return;
    this.injector.get(MockDb).reset();
    this.logout();
  }
}
