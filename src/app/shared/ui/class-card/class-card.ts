import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { TagRef } from '../../../core/models/dto/teacher.dto';
import { Subject } from '../../../core/models/tag';
import { SUBJECT_STYLE } from '../../topic/topic-style';
import { Chip } from '../chip/chip';
import { Icon } from '../icon/icon';

// Tarjeta de curso (02 y Cursos del docente). Las acciones van proyectadas a la derecha.
@Component({
  selector: 'ye-class-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Chip, Icon],
  template: `
    <span class="subject-icon" [class]="'tone-' + style().tone">
      <ye-icon [name]="style().icon" [size]="40" [strokeWidth]="2.4" />
    </span>
    <div class="body">
      <div class="title-row">
        <h2>{{ label() }}</h2>
        @if (meta()) {
          <span class="meta">{{ meta() }}</span>
        }
      </div>
      <div class="topics">
        <span class="topics-label">Temas:</span>
        @for (t of topics(); track t.id) {
          <ye-chip [tone]="style().tone">{{ t.name }}</ye-chip>
        }
      </div>
    </div>
    <div class="actions">
      <ng-content />
    </div>
  `,
  styleUrl: './class-card.scss',
})
export class ClassCard {
  readonly label = input.required<string>();
  readonly subject = input.required<Subject>();
  readonly topics = input<TagRef[]>([]);
  // Texto junto al título: "Prof. Rosa Díaz" o "26 estudiantes"
  readonly meta = input('');

  protected readonly style = computed(() => SUBJECT_STYLE[this.subject()]);
}
