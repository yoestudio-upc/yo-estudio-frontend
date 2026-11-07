import { TestBed } from '@angular/core/testing';
import { Yoyo, YoyoPose } from './yoyo';

describe('Yoyo', () => {
  const poses: YoyoPose[] = ['wave', 'calm', 'look', 'thinking', 'happy', 'mark'];

  it.each(poses)('se dibuja en la pose %s y es decorativo', async (pose) => {
    const fixture = TestBed.createComponent(Yoyo);
    fixture.componentRef.setInput('pose', pose);
    fixture.componentRef.setInput('size', 60);
    await fixture.whenStable();
    const host = fixture.nativeElement as HTMLElement;
    const svg = host.querySelector('svg')!;

    expect(host.getAttribute('aria-hidden')).toBe('true');
    expect(svg.getAttribute('width')).toBe('60');
    expect(svg.querySelectorAll('ellipse, path, circle').length).toBeGreaterThan(5);
  });
});
