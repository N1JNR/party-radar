import { DOCUMENT, Provider, inject } from '@angular/core';

import { environment } from '../../../environments/environment';
import { AUTH_GATEWAY, AuthGateway } from './auth.gateway';
import { FAKE_LOGIN_PARAM, FakeAuthGateway } from './fake-auth.gateway';
import { SupabaseAuthGateway } from './supabase-auth.gateway';

export type AuthGatewayKind = 'supabase' | 'simulado';

/**
 * Qual login o app usa (spec 001, CA22): no build de produção, sempre o Supabase. Em
 * desenvolvimento também, a não ser que a URL traga `?simular-login=` para revisar os estados.
 */
export function authGatewayKind(production: boolean, search: string): AuthGatewayKind {
  if (production) {
    return 'supabase';
  }
  return new URLSearchParams(search).has(FAKE_LOGIN_PARAM) ? 'simulado' : 'supabase';
}

/** Fornece o `AUTH_GATEWAY` escolhido ao abrir o app. */
export function provideAuthGateway(production = environment.production): Provider[] {
  return [
    SupabaseAuthGateway,
    FakeAuthGateway,
    {
      provide: AUTH_GATEWAY,
      useFactory: (): AuthGateway => {
        const search = inject(DOCUMENT).defaultView?.location.search ?? '';
        return authGatewayKind(production, search) === 'simulado'
          ? inject(FakeAuthGateway)
          : inject(SupabaseAuthGateway);
      },
    },
  ];
}
