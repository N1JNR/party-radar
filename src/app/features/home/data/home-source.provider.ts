import { DOCUMENT, Provider, inject } from '@angular/core';

import { AUTH_GATEWAY } from '../../../core/auth/auth.gateway';
import { FakeAuthGateway } from '../../../core/auth/fake-auth.gateway';
import { environment } from '../../../../environments/environment';
import { FakeHomeSource } from './fake-home.source';
import { HOME_DATA_SOURCE, HomeDataSource } from './home.source';
import { SupabaseHomeSource } from './supabase-home.source';

/**
 * Qual home o app usa (spec 003, Parte 3b): no build de produção, sempre a real. Em
 * desenvolvimento também, a não ser que a URL traga `?simular=` (cenários da spec 002).
 */
export function useFakeHome(production: boolean, search: string): boolean {
  return !production && new URLSearchParams(search).has('simular');
}

/**
 * Login simulado (`?simular-login=`, só em desenvolvimento) não tem sessão de verdade: com ele, a
 * home e a Steam também são as simuladas, senão a fonte real só daria erro. Olha o login escolhido
 * ao abrir o app, porque o parâmetro some da URL depois de entrar.
 */
export function usingFakeLogin(): boolean {
  return inject(AUTH_GATEWAY, { optional: true }) instanceof FakeAuthGateway;
}

export function provideHomeSource(production = environment.production): Provider[] {
  return [
    SupabaseHomeSource,
    FakeHomeSource,
    {
      provide: HOME_DATA_SOURCE,
      useFactory: (): HomeDataSource => {
        const search = inject(DOCUMENT).defaultView?.location.search ?? '';
        return useFakeHome(production, search) || usingFakeLogin()
          ? inject(FakeHomeSource)
          : inject(SupabaseHomeSource);
      },
    },
  ];
}
