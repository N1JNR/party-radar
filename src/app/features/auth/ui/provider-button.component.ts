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
  template: `
    <button
      type="button"
      class="provider-button"
      [class]="'provider-button--' + provider()"
      [disabled]="disabled() || opening()"
      [attr.aria-busy]="opening()"
      (click)="pressed.emit()"
    >
      <img class="provider-button__logo" [src]="logo()" alt="" />
      <span>{{ label() }}</span>
    </button>
  `,
  styles: `
    :host {
      display: block;
    }
    .provider-button {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      width: 100%;
      min-height: 48px;
      padding: 0 12px;
      border: 0;
      border-radius: var(--border-radius-md);
      font-size: 14px;
      line-height: 20px;
      cursor: pointer;
      transition: background-color 150ms ease-out;
    }
    .provider-button:focus-visible {
      outline: var(--border-width-md) solid var(--color-action-focus);
      outline-offset: 2px;
    }
    .provider-button:disabled {
      cursor: not-allowed;
    }
    .provider-button:disabled:not([aria-busy='true']) {
      opacity: 0.5;
    }
    .provider-button__logo {
      flex: none;
    }

    /* Cores da marca Discord (discord.com/branding). */
    .provider-button--discord {
      background: #5865f2;
      color: #ffffff;
      font-family: var(--font-family-theme);
      font-weight: 600;
    }
    .provider-button--discord .provider-button__logo {
      width: 24px;
      height: 18px;
    }
    .provider-button--discord:hover:not(:disabled) {
      background: color-mix(in srgb, #5865f2 88%, #000000);
    }

    /* Botão escuro do Google (developers.google.com/identity/branding-guidelines). */
    .provider-button--google {
      background: #131314;
      box-shadow: inset 0 0 0 1px #8e918f;
      color: #e3e3e3;
      font-family: var(--pr-font-google);
      font-weight: 500;
    }
    .provider-button--google .provider-button__logo {
      /* O SVG oficial tem 40 px com 10 px de respiro em volta do "G" de 20 px. */
      width: 40px;
      height: 40px;
      margin: -10px;
    }
    .provider-button--google:hover:not(:disabled) {
      background: color-mix(in srgb, #131314 92%, #e3e3e3);
    }

    @media (prefers-reduced-motion: reduce) {
      .provider-button {
        transition: none;
      }
    }
  `,
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
