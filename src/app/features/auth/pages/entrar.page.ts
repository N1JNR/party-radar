import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Injector,
  afterNextRender,
  computed,
  inject,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { PoIconModule } from '@po-ui/ng-components';

import type { AuthProvider } from '../../../core/auth/auth.gateway';
import { AuthStore } from '../../../core/auth/auth.store';
import {
  currentFeedback,
  failOpening,
  initialLoginScreen,
  isBusy,
  isOpening,
  startOpening,
} from '../domain/login-screen';
import { ProviderButtonComponent } from '../ui/provider-button.component';
import { RadarHeroComponent } from '../ui/radar-hero.component';

/** Tela Entrar (spec 001). Orquestra o AuthStore e os componentes de apresentação. */
@Component({
  selector: 'app-entrar-page',
  imports: [PoIconModule, ProviderButtonComponent, RadarHeroComponent],
  template: `
    <main class="entrar">
      <app-radar-hero class="entrar__radar" />
      <h1 class="entrar__title">Party Radar</h1>
      <p class="entrar__tagline">Veja quem do seu grupo está jogando agora e chame a galera.</p>

      <div class="entrar__feedback" aria-live="polite">
        @if (feedback(); as feedback) {
          <p class="entrar__alert" [class.entrar__alert--error]="feedback.tone === 'error'">
            <po-icon
              class="entrar__alert-icon"
              [p-icon]="feedback.tone === 'error' ? 'an an-warning-circle' : 'an an-info'"
              aria-hidden="true"
            />
            <span>{{ feedback.message }}</span>
          </p>
        }
      </div>

      <div class="entrar__actions">
        @for (provider of providers; track provider) {
          <app-provider-button
            [attr.data-provider]="provider"
            [provider]="provider"
            [opening]="opening(provider)"
            [disabled]="busy()"
            (pressed)="signIn(provider)"
          />
        }
      </div>

      <p class="entrar__note">
        Usamos seu nome e foto do Discord ou do Google para criar seu perfil.
      </p>
    </main>
  `,
  styles: `
    .entrar {
      box-sizing: border-box;
      min-height: 100dvh;
      max-width: 400px;
      margin: 0 auto;
      padding: var(--spacing-lg) var(--spacing-sm);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
    }
    .entrar__title {
      margin: var(--spacing-sm) 0 0;
      font-family: var(--font-family-heading);
      font-size: var(--font-size-xl);
      font-weight: 700;
      line-height: var(--line-height-xs);
      color: var(--pr-text);
    }
    .entrar__tagline {
      max-width: 30ch;
      margin: var(--spacing-xs) 0 0;
      color: var(--pr-text-muted);
      font-size: var(--font-size-default);
      line-height: var(--line-height-md);
    }
    .entrar__feedback {
      width: 100%;
      margin-top: var(--spacing-md);
    }
    .entrar__alert {
      display: flex;
      align-items: flex-start;
      gap: var(--spacing-xs);
      margin: 0 0 var(--spacing-sm);
      padding: var(--spacing-xs) var(--spacing-sm);
      border-radius: var(--border-radius-lg);
      background: var(--pr-surface-raised);
      color: var(--pr-text);
      font-size: var(--font-size-sm);
      line-height: var(--line-height-sm);
      text-align: left;
    }
    .entrar__alert-icon {
      flex: none;
      color: var(--pr-presence-online);
    }
    .entrar__alert--error .entrar__alert-icon {
      color: var(--color-feedback-negative-base);
    }
    .entrar__actions {
      width: 100%;
      max-width: 360px;
      display: grid;
      gap: var(--spacing-xs);
    }
    .entrar__note {
      max-width: 36ch;
      margin: var(--spacing-md) 0 0;
      color: var(--pr-text-muted);
      font-size: var(--font-size-xs);
      line-height: var(--line-height-md);
    }
    @media (min-width: 768px) {
      .entrar__title {
        font-size: var(--font-size-2xl);
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EntrarPage {
  private readonly store = inject(AuthStore);
  private readonly router = inject(Router);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);

  protected readonly providers: readonly AuthProvider[] = ['discord', 'google'];
  private readonly screen = signal(initialLoginScreen(this.store.consumeFailure()));

  protected readonly busy = computed(() => isBusy(this.screen()));
  protected readonly feedback = computed(() => currentFeedback(this.screen()));

  protected opening(provider: AuthProvider): boolean {
    return isOpening(this.screen(), provider);
  }

  protected async signIn(provider: AuthProvider): Promise<void> {
    if (this.busy()) {
      return;
    }
    this.screen.update((state) => startOpening(state, provider));
    const result = await this.store.signIn(provider);
    if (result.ok) {
      await this.router.navigateByUrl('/inicio');
      return;
    }
    this.screen.set(failOpening(result.failure));
    this.focusProvider(provider);
  }

  /** O botão tocado foi desabilitado durante o login; devolve o foco a ele (CA20). */
  private focusProvider(provider: AuthProvider): void {
    afterNextRender(
      () =>
        this.host.nativeElement
          .querySelector<HTMLButtonElement>(`[data-provider="${provider}"] button`)
          ?.focus(),
      { injector: this.injector },
    );
  }
}
