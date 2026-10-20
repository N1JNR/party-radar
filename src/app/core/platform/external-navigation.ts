import { DOCUMENT, Injectable, inject } from '@angular/core';

/**
 * Sair do app para um endereço de fora (ex.: o login da Steam) e saber a origem do app. Fica em
 * `core/platform/` para trocar pelo navegador do Capacitor no futuro (AGENTS.md, seção 4).
 */
@Injectable({ providedIn: 'root' })
export class ExternalNavigation {
  private readonly document = inject(DOCUMENT);

  /** Origem em que o app roda, ex.: `http://localhost:4200`. Vazia fora do navegador. */
  origin(): string {
    return this.document.defaultView?.location.origin ?? '';
  }

  /** Vai para o endereço, saindo do app. */
  go(url: string): void {
    this.document.defaultView?.location.assign(url);
  }
}
