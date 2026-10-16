import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { PoAvatarModule, PoButtonModule } from '@po-ui/ng-components';

import { AuthStore } from '../../../core/auth/auth.store';

/**
 * Tela inicial provisória (spec 001): confirma quem entrou e permite sair.
 * Será substituída pelo Radar na spec 004.
 */
@Component({
  selector: 'app-home-page',
  imports: [PoAvatarModule, PoButtonModule],
  template: `
    <main class="inicio">
      @if (store.user(); as user) {
        <po-avatar class="inicio__avatar" [p-src]="user.avatarUrl ?? ''" p-size="lg" />
        <h1 class="inicio__title">Olá, {{ user.name }}</h1>
        <p class="inicio__username">&#64;{{ user.username }}</p>
        <p class="inicio__next">Em breve, aqui você vai ver quem do grupo está jogando agora.</p>
        <po-button
          p-label="Sair"
          p-kind="secondary"
          [p-loading]="leaving()"
          (p-click)="signOut()"
        />
      }
    </main>
  `,
  styles: `
    .inicio {
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
    .inicio__title {
      margin: var(--spacing-sm) 0 0;
      font-family: var(--font-family-heading);
      font-size: var(--font-size-lg);
      line-height: var(--line-height-xs);
      color: var(--pr-text);
    }
    .inicio__username {
      margin: var(--spacing-xxs) 0 0;
      color: var(--pr-text-muted);
      font-size: var(--font-size-sm);
    }
    .inicio__next {
      max-width: 30ch;
      margin: var(--spacing-md) 0 var(--spacing-lg);
      color: var(--pr-text-muted);
      line-height: var(--line-height-md);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomePage {
  protected readonly store = inject(AuthStore);
  private readonly router = inject(Router);
  protected readonly leaving = signal(false);

  protected async signOut(): Promise<void> {
    this.leaving.set(true);
    try {
      await this.store.signOut();
    } catch {
      // A sessão local já terminou no AuthStore; seguimos para Entrar mesmo assim (CA8).
    }
    await this.router.navigateByUrl('/entrar', { replaceUrl: true });
  }
}
