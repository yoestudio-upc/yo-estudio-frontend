import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { StudentProgressApi } from '../../../core/api/student-progress.api';
import { Goal } from '../../../core/models/dto/student.dto';
import { Goals } from './goals';

const goal = (priority: number, name: string): Goal => ({
  priority,
  classId: 'c-1',
  topic: { id: 't', code: 'fracciones', name: 'Fracciones' },
  subtopic: { id: `s-${priority}`, code: 's', name },
  level: 1,
  practice: { kind: 'concrete', text: 'Problemas con dibujos o con material para contar.' },
});

describe('Goals (06)', () => {
  async function render(goals: Goal[]) {
    TestBed.configureTestingModule({
      providers: [{ provide: StudentProgressApi, useValue: { getGoals: () => of(goals) } }],
    });
    const fixture = TestBed.createComponent(Goals);
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  it('muestra hasta 3 metas en fila, la primera con "¡Empieza aquí!"', async () => {
    const el = await render([1, 2, 3, 4].map((n) => goal(n, `Subtema ${n}`)));
    const cards = el.querySelectorAll('.goal');
    expect(cards.length).toBe(3);
    expect(cards[0].textContent).toContain('¡Empieza aquí!');
    expect(cards[1].textContent).not.toContain('¡Empieza aquí!');
    expect(cards[0].textContent).toContain('Cómo practicar');
    expect(el.querySelector('.later')?.textContent).toContain('Subtema 4');
  });

  it('las estrellas van con texto', async () => {
    const el = await render([goal(1, 'Sumar fracciones')]);
    expect(el.querySelector('.goal')?.textContent).toContain('Empezando');
  });

  it('sin metas lo explica con calma', async () => {
    const el = await render([]);
    expect(el.textContent).toContain('Por ahora no tienes metas');
    expect(el.textContent).toContain('¿Cómo lo hago?');
  });
});
