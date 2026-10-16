import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { AuthStore } from './core/auth/auth.store';

/**
 * Raiz do app. Enquanto verifica se já existe sessão, mostra só o indicador de
 * carregamento, para a tela Entrar não piscar (spec 001, CA11). O indicador é próprio, e não
 * do PO UI, para o PO UI continuar fora do bundle inicial.
 */
@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  template: `
    @if (store.status() === 'checking') {
      <div class="app-loading" role="status">
        <span class="app-loading__ring" aria-hidden="true"></span>
        <span>Verificando sua sessão…</span>
      </div>
    } @else {
      <router-outlet />
    }
  `,
  styles: `
    .app-loading {
      min-height: 100dvh;
      display: grid;
      place-content: center;
      justify-items: center;
      gap: var(--spacing-sm);
      color: var(--pr-text-muted);
      font-size: var(--font-size-sm);
    }
    .app-loading__ring {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      border: var(--border-width-md) solid var(--color-neutral-light-30);
      border-top-color: var(--color-brand-01-light);
      animation: app-loading-spin 900ms linear infinite;
    }
    @keyframes app-loading-spin {
      to {
        transform: rotate(360deg);
      }
    }
    @media (prefers-reduced-motion: reduce) {
      .app-loading__ring {
        animation: none;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  protected readonly store = inject(AuthStore);

  constructor() {
    void this.store.restore();
  }
}
