import { PLATFORM_ID, inject, Injector } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

/**
 * Aplica o tema do PO UI só no navegador.
 * No servidor (SSR) não existe `document` para o PO UI manipular.
 * O import é dinâmico para o PO UI não pesar no bundle inicial.
 */
export function initTheme(): Promise<void> | void {
  if (!isPlatformBrowser(inject(PLATFORM_ID))) {
    return;
  }
  const injector = inject(Injector);
  return import('./theme').then(({ AppThemeService }) => injector.get(AppThemeService).apply());
}
