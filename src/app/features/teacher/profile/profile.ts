import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { TeacherClassApi } from '../../../core/api/teacher-class.api';
import { AuthService } from '../../../core/auth/auth.service';
import { LOGIN_PATH } from '../../../core/auth/role-home';
import { classLabel } from '../../../shared/format/class-label';
import { Avatar } from '../../../shared/ui/avatar/avatar';
import { Button } from '../../../shared/ui/button/button';
import { Card } from '../../../shared/ui/card/card';
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
  private readonly classApi = inject(TeacherClassApi);

  protected readonly user = this.auth.user;
  protected readonly classes = rxResource({ stream: () => this.classApi.getMyClasses() });
  protected readonly label = classLabel;

  protected logout(): void {
    this.auth.logout();
    void this.router.navigateByUrl(LOGIN_PATH);
  }
}
