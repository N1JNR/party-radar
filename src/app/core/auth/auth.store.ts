import { Injectable, computed, inject, signal } from '@angular/core';

import { AUTH_GATEWAY, AuthProvider, AuthUser, LoginFailure, SignInResult } from './auth.gateway';

export type SessionStatus = 'checking' | 'anonymous' | 'authenticated';

/** Estado da sessão para o app inteiro. Só ele fala com o AuthGateway. */
@Injectable({ providedIn: 'root' })
export class AuthStore {
  private readonly gateway = inject(AUTH_GATEWAY);

  private readonly _status = signal<SessionStatus>('checking');
  private readonly _user = signal<AuthUser | null>(null);
  private pendingFailure: LoginFailure | null = null;

  readonly status = this._status.asReadonly();
  readonly user = this._user.asReadonly();
  readonly isAuthenticated = computed(() => this._status() === 'authenticated');

  /** Procura uma sessão salva ao abrir o app (CA11). Erro inesperado = sem sessão. */
  async restore(): Promise<void> {
    try {
      const session = await this.gateway.restoreSession();
      this.pendingFailure = session.failure ?? null;
      this.setUser(session.user);
    } catch {
      this.setUser(null);
    }
  }

  async signIn(provider: AuthProvider, redirectTo?: string): Promise<SignInResult> {
    let result: SignInResult;
    try {
      result = await this.gateway.signIn(provider, redirectTo);
    } catch {
      result = { ok: false, failure: 'failed' };
    }
    if (result.ok) {
      this.setUser(result.user);
    }
    return result;
  }

  /** Mesmo se o servidor falhar, a sessão local termina (CA8). */
  async signOut(): Promise<void> {
    try {
      await this.gateway.signOut();
    } finally {
      this.setUser(null);
    }
  }

  /** Aviso guardado para a tela de login (ex.: sessão expirada). Só é entregue uma vez. */
  consumeFailure(): LoginFailure | null {
    const failure = this.pendingFailure;
    this.pendingFailure = null;
    return failure;
  }

  private setUser(user: AuthUser | null): void {
    this._user.set(user);
    this._status.set(user ? 'authenticated' : 'anonymous');
  }
}
