import { DOCUMENT, Injectable, inject } from '@angular/core';

/**
 * Área de transferência. Fica em `core/platform/` para trocar pelo plugin do Capacitor no futuro
 * (AGENTS.md, seção 4).
 */
@Injectable({ providedIn: 'root' })
export class ClipboardService {
  private readonly document = inject(DOCUMENT);

  /** Copia o texto. Devolve `false`, sem erro, se o navegador não permitir. */
  async copy(text: string): Promise<boolean> {
    const clipboard = this.document.defaultView?.navigator.clipboard;
    if (!clipboard) {
      return false;
    }
    try {
      await clipboard.writeText(text);
      return true;
    } catch {
      return false;
    }
  }
}
