import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { NavItem } from './nav-item';
import { Sidebar } from './sidebar';

@Component({ template: '' })
class Blank {}

@Component({
  imports: [Sidebar],
  template: `<ye-sidebar
    [items]="items"
    userName="Camila Rojas"
    userDetail="4.° grado B"
    (logout)="exits = exits + 1"
  />`,
})
class Host {
  exits = 0;
  items: NavItem[] = [
    { label: 'Cursos', icon: 'books', tone: 'blue', path: '/cursos' },
    { label: 'Mis metas', icon: 'flag', tone: 'yellow', path: '/metas' },
  ];
}

describe('Sidebar', () => {
  async function render(url: string) {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          { path: 'cursos', component: Blank },
          { path: 'metas', component: Blank },
        ]),
      ],
    });
    await TestBed.inject(Router).navigateByUrl(url);
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    return { fixture, el: fixture.nativeElement as HTMLElement };
  }

  it('marca la página actual con aria-current', async () => {
    const { el } = await render('/metas');
    const current = el.querySelector('a[aria-current="page"]');
    expect(current?.textContent).toContain('Mis metas');
    expect(el.querySelectorAll('a[aria-current]').length).toBe(1);
  });

  it('muestra iniciales, nombre y grado del usuario', async () => {
    const { el } = await render('/cursos');
    expect(el.querySelector('ye-avatar')?.textContent?.trim()).toBe('CR');
    expect(el.textContent).toContain('4.° grado B');
  });

  it('Salir es un botón que avisa al contenedor', async () => {
    const { el, fixture } = await render('/cursos');
    const exit = [...el.querySelectorAll('button')].find((b) => b.textContent?.includes('Salir'));
    exit!.click();
    expect(fixture.componentInstance.exits).toBe(1);
  });
});
