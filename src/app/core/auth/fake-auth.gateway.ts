import { DOCUMENT, Injectable, InjectionToken, inject } from '@angular/core';

import { environment } from '../../../environments/environment';
import { AuthGateway, AuthProvider, AuthUser, RestoredSession, SignInResult } from './auth.gateway';

/**
 * Login simulado da Parte 1 da spec 001. Não fala com nenhum servidor.
 * Em desenvolvimento, `?simular-login=` na URL liga este gateway (veja `auth-gateway.provider.ts`)
 * e escolhe o cenário, para revisar cada estado da tela.
 */
export type FakeScenario =
  'success' | 'cancelled' | 'failed' | 'offline' | 'session-expired' | 'checking';

const SCENARIO_BY_PARAM: Record<string, FakeScenario> = {
  cancelado: 'cancelled',
  erro: 'failed',
  'sem-conexao': 'offline',
  'sessao-expirada': 'session-expired',
  verificando: 'checking',
};

/** Parâmetro da URL que liga o login simulado em desenvolvimento (spec 001, CA22). */
export const FAKE_LOGIN_PARAM = 'simular-login';

/** Cenário a partir da query string. Em produção é sempre `success`. */
export function fakeScenarioFrom(search: string, production: boolean): FakeScenario {
  if (production) {
    return 'success';
  }
  const param = new URLSearchParams(search).get(FAKE_LOGIN_PARAM) ?? '';
  return SCENARIO_BY_PARAM[param] ?? 'success';
}

export interface FakeAuthOptions {
  scenario: FakeScenario;
  /** Tempo em "Abrindo…" antes de responder (CA12). */
  signInDelayMs: number;
  /** Tempo verificando a sessão no cenário `checking` (CA11). */
  checkingDelayMs: number;
}

export const FAKE_AUTH_OPTIONS = new InjectionToken<FakeAuthOptions>('FAKE_AUTH_OPTIONS', {
  providedIn: 'root',
  factory: () => ({
    scenario: fakeScenarioFrom(
      inject(DOCUMENT).defaultView?.location.search ?? '',
      environment.production,
    ),
    signInDelayMs: 1500,
    checkingDelayMs: 3000,
  }),
});

export const FAKE_USER: AuthUser = { name: 'Ana Souza', username: 'ana', avatarUrl: null };

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

@Injectable()
export class FakeAuthGateway implements AuthGateway {
  private readonly options = inject(FAKE_AUTH_OPTIONS);

  async restoreSession(): Promise<RestoredSession> {
    switch (this.options.scenario) {
      case 'checking':
        await wait(this.options.checkingDelayMs);
        return { user: null };
      case 'session-expired':
        return { user: null, failure: 'session-expired' };
      default:
        return { user: null };
    }
  }

  async signIn(provider: AuthProvider): Promise<SignInResult> {
    // Sem internet, o navegador nem chega a sair do app.
    if (this.options.scenario === 'offline') {
      return { ok: false, failure: 'offline' };
    }
    await wait(this.options.signInDelayMs);
    switch (this.options.scenario) {
      case 'cancelled':
        return { ok: false, failure: 'cancelled' };
      case 'failed':
        return { ok: false, failure: 'failed' };
      default:
        return { ok: true, user: { ...FAKE_USER, name: `${FAKE_USER.name} (${provider})` } };
    }
  }

  async signOut(): Promise<void> {
    await wait(0);
  }

  /** A sessão simulada só termina pelo Sair. */
  onSessionEnded(): () => void {
    return () => undefined;
  }
}
