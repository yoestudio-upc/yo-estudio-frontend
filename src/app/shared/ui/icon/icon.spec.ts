import { TestBed } from '@angular/core/testing';
import { Icon } from './icon';
import { ICONS, IconName } from './icons';

describe('Icon', () => {
  async function render(name: IconName, label?: string) {
    const fixture = TestBed.createComponent(Icon);
    fixture.componentRef.setInput('name', name);
    if (label) fixture.componentRef.setInput('label', label);
    await fixture.whenStable();
    return (fixture.nativeElement as HTMLElement).querySelector('svg')!;
  }

  it('dibuja cada ícono del registro', async () => {
    for (const name of Object.keys(ICONS) as IconName[]) {
      const svg = await render(name);
      expect(svg.querySelectorAll('path').length, name).toBeGreaterThan(0);
    }
  });

  it('es decorativo por defecto', async () => {
    const svg = await render('star');
    expect(svg.getAttribute('aria-hidden')).toBe('true');
    expect(svg.hasAttribute('role')).toBe(false);
  });

  it('con label se anuncia como imagen', async () => {
    const svg = await render('logout', 'Salir');
    expect(svg.getAttribute('role')).toBe('img');
    expect(svg.getAttribute('aria-label')).toBe('Salir');
    expect(svg.hasAttribute('aria-hidden')).toBe(false);
  });
});
