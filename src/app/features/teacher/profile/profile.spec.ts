import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { AuthApi } from '../../../core/api/auth.api';
import { MockDb } from '../../../core/api/mock/mock-db';
import { TeacherClassApi } from '../../../core/api/teacher-class.api';
import { AuthService } from '../../../core/auth/auth.service';
import { SessionStore } from '../../../core/auth/session-store';
import { fakeToken } from '../../../core/auth/testing';
import { Confirm } from '../../../shared/ui/confirm-dialog/confirm-dialog';
import { TeacherProfile } from './profile';

describe('TeacherProfile', () => {
  async function render() {
    new SessionStore().write({
      accessToken: fakeToken('docente'),
      user: { id: 't-1', name: 'Rosa Díaz', role: 'docente' },
    });
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: AuthApi, useValue: {} },
        {
          provide: TeacherClassApi,
          useValue: {
            getMyClasses: () =>
              of([
                {
                  id: 'c-1',
                  name: 'Matemática',
                  grade: 4,
                  section: 'B',
                  subject: 'matematica',
                  joinCode: 'K7P2QX',
                  studentCount: 26,
                  topics: [],
                },
              ]),
          },
        },
        { provide: Confirm, useValue: { ask: () => Promise.resolve(true) } },
      ],
    });
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    const fixture = TestBed.createComponent(TeacherProfile);
    await fixture.whenStable();
    return { el: fixture.nativeElement as HTMLElement, navigate };
  }

  it('muestra nombre, cursos y código para unirse', async () => {
    const { el } = await render();
    expect(el.textContent).toContain('Rosa Díaz');
    expect(el.textContent).toContain('Matemática · 4.° B');
    expect(el.textContent).toContain('K7P2QX');
  });

  it('cerrar sesión limpia la sesión y vuelve al ingreso', async () => {
    const { el, navigate } = await render();
    [...el.querySelectorAll('button')]
      .find((b) => b.textContent?.includes('Cerrar sesión'))!
      .click();
    expect(TestBed.inject(AuthService).isAuthenticated()).toBe(false);
    expect(navigate).toHaveBeenCalledWith('/ingreso');
  });

  it('restablecer los datos de ejemplo vuelve al estado inicial', async () => {
    const { el } = await render();
    const db = TestBed.inject(MockDb);
    const reset = vi.spyOn(db, 'reset');
    [...el.querySelectorAll('button')].find((b) => b.textContent?.includes('Restablecer'))!.click();
    await new Promise((r) => setTimeout(r));
    expect(reset).toHaveBeenCalled();
  });
});
