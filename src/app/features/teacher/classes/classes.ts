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
import { TeacherClassApi } from '../../../core/api/teacher-class.api';
import { SUBJECT_NAMES, Subject } from '../../../core/models/tag';
import { classLabel, normalizeText } from '../../../shared/format/class-label';
import { Button } from '../../../shared/ui/button/button';
import { Card } from '../../../shared/ui/card/card';
import { ClassCard } from '../../../shared/ui/class-card/class-card';
import { Icon } from '../../../shared/ui/icon/icon';
import { PageHeader } from '../../../shared/ui/page-header/page-header';
import { SearchBox } from '../../../shared/ui/search-box/search-box';

// Una o dos letras (ej. "B")
const SECTION_PATTERN = /^\p{L}{1,2}$/u;

// Cursos del docente: versión docente de la pantalla 02. HU09: crea cursos aquí mismo.
@Component({
  selector: 'ye-teacher-classes',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, RouterLink, Button, Card, ClassCard, Icon, PageHeader, SearchBox],
  templateUrl: './classes.html',
  styleUrl: './classes.scss',
})
export class TeacherClasses {
  private readonly api = inject(TeacherClassApi);
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

  // Crear un curso
  protected readonly subjects = Object.entries(SUBJECT_NAMES) as [Subject, string][];
  protected readonly grades = [1, 2, 3, 4, 5, 6];
  protected readonly creating = signal(false);
  protected readonly subject = signal<Subject>('matematica');
  protected readonly grade = signal(4);
  protected readonly section = signal('');
  protected readonly createError = signal<string | null>(null);
  protected readonly createBusy = signal(false);
  protected readonly notice = signal<string | null>(null);

  protected openCreate(): void {
    this.creating.set(true);
    this.createError.set(null);
    this.notice.set(null);
    this.focus('#create-subject');
  }

  protected closeCreate(): void {
    this.creating.set(false);
    this.section.set('');
    this.createError.set(null);
    this.focus('.create');
  }

  protected async create(): Promise<void> {
    const section = this.section().trim().toUpperCase();
    if (!SECTION_PATTERN.test(section)) {
      this.createError.set('Escribe la sección con una o dos letras (ej. B).');
      this.focus('#create-section');
      return;
    }
    if (this.createBusy()) return;
    this.createBusy.set(true);
    this.createError.set(null);
    try {
      const created = await firstValueFrom(
        this.api.create({ subject: this.subject(), grade: this.grade(), section }),
      );
      this.notice.set(
        `¡Listo! Creaste ${classLabel(created)}. Comparte el código ${created.joinCode} con tus estudiantes.`,
      );
      this.creating.set(false);
      this.section.set('');
      this.classes.reload();
    } catch (error) {
      const status = error instanceof HttpErrorResponse ? error.status : 0;
      this.createError.set(
        status === 422
          ? 'Revisa el área, el grado y la sección.'
          : 'No pudimos crear el curso. Intenta otra vez.',
      );
    } finally {
      this.createBusy.set(false);
    }
  }

  private focus(selector: string): void {
    afterNextRender(() => this.host.nativeElement.querySelector<HTMLElement>(selector)?.focus(), {
      injector: this.injector,
    });
  }
}
