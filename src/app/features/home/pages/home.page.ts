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
  templateUrl: './home.page.html',
  styleUrl: './home.page.scss',
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
      // A sessão local já terminou no AuthStore; seguimos para o login mesmo assim (CA8).
    }
    await this.router.navigateByUrl('/login', { replaceUrl: true });
  }
}
