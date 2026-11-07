import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { TeacherClassApi } from '../../../core/api/teacher-class.api';
import { classLabel, normalizeText } from '../../../shared/format/class-label';
import { Button } from '../../../shared/ui/button/button';
import { Card } from '../../../shared/ui/card/card';
import { ClassCard } from '../../../shared/ui/class-card/class-card';
import { Icon } from '../../../shared/ui/icon/icon';
import { PageHeader } from '../../../shared/ui/page-header/page-header';
import { SearchBox } from '../../../shared/ui/search-box/search-box';

// Cursos del docente: versión docente de la pantalla 02
@Component({
  selector: 'ye-teacher-classes',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, Button, Card, ClassCard, Icon, PageHeader, SearchBox],
  templateUrl: './classes.html',
  styleUrl: './classes.scss',
})
export class TeacherClasses {
  private readonly api = inject(TeacherClassApi);

  protected readonly classes = rxResource({ stream: () => this.api.getMyClasses() });
  protected readonly query = signal('');
  protected readonly showSoon = signal(false);

  protected readonly items = computed(() => {
    const term = normalizeText(this.query());
    return (this.classes.value() ?? [])
      .map((c) => ({ ...c, label: classLabel(c) }))
      .filter((c) => !term || normalizeText(c.label).includes(term));
  });
}
