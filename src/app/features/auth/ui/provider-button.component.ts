import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

import type { AuthProvider } from '../../../core/auth/auth.gateway';
import { providerButtonLabel } from '../domain/login-feedback';

const LOGO: Record<AuthProvider, string> = {
  discord: 'brands/discord-symbol-white.svg',
  google: 'brands/google-g.svg',
};

/**
 * Botão de login com a marca do provedor. Segue as diretrizes do Discord e do Google
 * (DESIGN.md, seção 1), por isso não usa o po-button: as cores pertencem às marcas.
 */
@Component({
  selector: 'app-provider-button',
  templateUrl: './provider-button.component.html',
  styleUrl: './provider-button.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProviderButtonComponent {
  readonly provider = input.required<AuthProvider>();
  /** Este botão está redirecionando para o provedor (CA12). */
  readonly opening = input(false);
  /** Outro login está em andamento (CA12). */
  readonly disabled = input(false);
  readonly pressed = output<void>();

  protected readonly label = computed(() => providerButtonLabel(this.provider(), this.opening()));
  protected readonly logo = computed(() => LOGO[this.provider()]);
}
