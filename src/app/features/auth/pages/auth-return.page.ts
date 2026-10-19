import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { AuthStore } from '../../../core/auth/auth.store';
import { returnFailure, safeDestination } from '../domain/auth-return';

/**
 * Volta do provedor (spec 001, Parte 2a). O cliente do Supabase troca o código pela sessão ao
 * abrir o app; esta tela espera isso terminar e leva ao destino seguro (CA5, CA6) ou, se o login
 * falhou ou foi cancelado, à tela de login com o aviso (CA13, CA14).
 */
@Component({
  selector: 'app-auth-return-page',
  templateUrl: './auth-return.page.html',
  styleUrl: './auth-return.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthReturnPage {
  private readonly store = inject(AuthStore);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  constructor() {
    void this.finish();
  }

  private async finish(): Promise<void> {
    await this.store.whenReady();
    const query = this.route.snapshot.queryParamMap;
    const failure =
      returnFailure(query.get('error')) ?? (this.store.isAuthenticated() ? null : 'failed');
    if (failure) {
      this.store.rememberFailure(failure);
      await this.router.navigateByUrl('/login', { replaceUrl: true });
      return;
    }
    await this.router.navigateByUrl(safeDestination(query.get('next')), { replaceUrl: true });
  }
}
