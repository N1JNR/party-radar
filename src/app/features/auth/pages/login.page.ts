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

/** Tela de login (spec 001). Orquestra o AuthStore e os componentes de apresentação. */
@Component({
  selector: 'app-login-page',
  imports: [PoIconModule, ProviderButtonComponent, RadarHeroComponent],
  templateUrl: './login.page.html',
  styleUrl: './login.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginPage {
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
