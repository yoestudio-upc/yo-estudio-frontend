import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Injector,
  afterNextRender,
  computed,
  inject,
  signal,
} from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { StudentClassApi } from '../../../core/api/student-class.api';
import { classLabel, normalizeText } from '../../../shared/format/class-label';
import { Button } from '../../../shared/ui/button/button';
import { Card } from '../../../shared/ui/card/card';
import { ClassCard } from '../../../shared/ui/class-card/class-card';
import { Icon } from '../../../shared/ui/icon/icon';
import { PageHeader } from '../../../shared/ui/page-header/page-header';
import { SearchBox } from '../../../shared/ui/search-box/search-box';

// 02 · Cursos del estudiante. Se une a un curso con el código que le da su profe.
@Component({
  selector: 'ye-student-classes',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, RouterLink, Button, Card, ClassCard, Icon, PageHeader, SearchBox],
  templateUrl: './classes.html',
  styleUrl: './classes.scss',
})
export class StudentClasses {
  private readonly api = inject(StudentClassApi);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);

  protected readonly classes = rxResource({ stream: () => this.api.getMyClasses() });
  protected readonly query = signal('');

  protected readonly items = computed(() => {
    const term = normalizeText(this.query());
    return (this.classes.value() ?? [])
      .map((c) => ({ ...c, label: classLabel(c) }))
      .filter((c) => !term || normalizeText(c.label).includes(term));
  });

  // Unirse a un curso
  protected readonly joining = signal(false);
  protected readonly code = signal('');
  protected readonly joinError = signal<string | null>(null);
  protected readonly joinBusy = signal(false);
  protected readonly notice = signal<string | null>(null);

  protected openJoin(): void {
    this.joining.set(true);
    this.joinError.set(null);
    this.notice.set(null);
    this.focus('#join-code');
  }

  protected closeJoin(): void {
    this.joining.set(false);
    this.code.set('');
    this.joinError.set(null);
    this.focus('.join-toggle');
  }

  protected async join(): Promise<void> {
    const code = this.code().trim();
    if (!code) {
      this.joinError.set('Escribe el código que te dio tu profe.');
      return;
    }
    if (this.joinBusy()) return;
    this.joinBusy.set(true);
    this.joinError.set(null);
    try {
      const joined = await firstValueFrom(this.api.join(code));
      this.notice.set(`¡Listo! Ya estás en ${classLabel(joined)}.`);
      this.joining.set(false);
      this.code.set('');
      this.classes.reload();
    } catch (error) {
      const status = error instanceof HttpErrorResponse ? error.status : 0;
      this.joinError.set(
        status === 404
          ? 'No encontramos un curso con ese código. Revísalo con tu profe.'
          : status === 409
            ? 'Ya estás en ese curso.'
            : 'No pudimos conectarnos. Intenta otra vez.',
      );
    } finally {
      this.joinBusy.set(false);
    }
  }

  protected pendingLabel(count: number): string {
    return count === 1 ? '1 evaluación pendiente' : `${count} evaluaciones pendientes`;
  }

  private focus(selector: string): void {
    afterNextRender(() => this.host.nativeElement.querySelector<HTMLElement>(selector)?.focus(), {
      injector: this.injector,
    });
  }
}
