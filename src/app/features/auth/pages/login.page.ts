import {
  ChangeDetectionStrategy,
  Component,
  DOCUMENT,
  DestroyRef,
  ElementRef,
  Injector,
  afterNextRender,
  computed,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PoIconModule } from '@po-ui/ng-components';

import type { AuthProvider } from '../../../core/auth/auth.gateway';
import { AuthStore } from '../../../core/auth/auth.store';
import { returnUrl, safeDestination } from '../domain/auth-return';
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
  private readonly route = inject(ActivatedRoute);
  private readonly document = inject(DOCUMENT);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);

  protected readonly providers: readonly AuthProvider[] = ['discord'];
  private readonly screen = signal(initialLoginScreen(this.store.consumeFailure()));

  protected readonly busy = computed(() => isBusy(this.screen()));
  protected readonly feedback = computed(() => currentFeedback(this.screen()));

  constructor() {
    // Ao voltar do provedor pelo botão "voltar", o navegador pode restaurar esta tela da memória
    // (bfcache) ainda em "Abrindo…". Nesse caso, os botões voltam a funcionar.
    const view = this.document.defaultView;
    const restored = (event: PageTransitionEvent) => {
      if (event.persisted) {
        this.screen.set(initialLoginScreen());
      }
    };
    view?.addEventListener('pageshow', restored);
    inject(DestroyRef).onDestroy(() => view?.removeEventListener('pageshow', restored));
  }

  protected opening(provider: AuthProvider): boolean {
    return isOpening(this.screen(), provider);
  }

  protected async signIn(provider: AuthProvider): Promise<void> {
    if (this.busy()) {
      return;
    }
    this.screen.update((state) => startOpening(state, provider));
    // O destino pedido antes do login viaja até a volta do provedor (CA5).
    const next = this.route.snapshot.queryParamMap.get('next');
    const origin = this.document.defaultView?.location.origin ?? '';
    const result = await this.store.signIn(provider, returnUrl(origin, next));
    if (result.ok) {
      // Login sem sair do app (o simulado): vai direto ao destino seguro.
      await this.router.navigateByUrl(safeDestination(next));
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
