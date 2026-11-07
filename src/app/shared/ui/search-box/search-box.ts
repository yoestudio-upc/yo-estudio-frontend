import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { Button } from '../button/button';
import { Icon } from '../icon/icon';

// Buscador de la barra de herramientas (filtra mientras se escribe)
@Component({
  selector: 'ye-search-box',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Button, Icon],
  template: `
    <form class="search" role="search" (submit)="$event.preventDefault()">
      <label class="box">
        <ye-icon name="search" [size]="22" />
        <span class="visually-hidden">{{ placeholder() }}</span>
        <input type="search" [placeholder]="placeholder()" (input)="onInput($event)" />
      </label>
      <button yeButton variant="soft" type="submit">Buscar</button>
    </form>
  `,
  styles: `
    :host {
      display: block;
      flex-grow: 1;
      min-width: 0;
    }

    .search {
      display: flex;
      gap: 14px;

      [yeButton] {
        min-height: 58px;
        padding: 0 28px;
      }
    }

    .box {
      display: flex;
      flex-grow: 1;
      align-items: center;
      gap: var(--space-3);
      min-width: 0;
      min-height: 58px;
      padding: 0 22px;
      border: 2px solid var(--border);
      border-radius: var(--radius-pill);
      background: var(--surface);
      color: var(--text-3);

      &:focus-within {
        border-color: var(--brand);
        box-shadow: var(--focus-ring);
      }
    }

    input {
      flex-grow: 1;
      min-width: 0;
      min-height: 50px;
      border: none;
      background: transparent;
      font-size: 18px;
      color: var(--text);

      &:focus-visible {
        box-shadow: none;
      }

      &::placeholder {
        color: var(--placeholder);
      }
    }
  `,
})
export class SearchBox {
  readonly placeholder = input('Buscar');
  readonly query = output<string>();

  protected onInput(event: Event): void {
    this.query.emit((event.target as HTMLInputElement).value);
  }
}
