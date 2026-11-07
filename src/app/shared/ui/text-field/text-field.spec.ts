import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TextField, TextFieldInput } from './text-field';

@Component({
  imports: [TextField, TextFieldInput],
  template: `
    <ye-text-field label="Usuario" icon="user" [error]="error()">
      <input yeInput />
    </ye-text-field>
  `,
})
class Host {
  readonly error = signal<string | null>(null);
}

describe('TextField', () => {
  it('une label, input y mensaje de error para lectores de pantalla', async () => {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    const label = el.querySelector('label')!;
    const input = el.querySelector('input')!;

    expect(label.htmlFor).toBe(input.id);
    expect(input.hasAttribute('aria-describedby')).toBe(false);

    fixture.componentInstance.error.set('Revisa tu usuario');
    await fixture.whenStable();

    const error = el.querySelector('.error')!;
    expect(input.getAttribute('aria-describedby')).toBe(error.id);
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(error.textContent).toContain('Revisa tu usuario');
  });
});
