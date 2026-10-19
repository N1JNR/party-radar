import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';

import { AUTH_GATEWAY, AuthProvider, AuthUser, LoginFailure, SignInResult } from './auth.gateway';

export type SessionStatus = 'checking' | 'anonymous' | 'authenticated';

/** Estado da sessão para o app inteiro. Só ele fala com o AuthGateway. */
@Injectable({ providedIn: 'root' })
export class AuthStore {
  private readonly gateway = inject(AUTH_GATEWAY);

  private readonly _status = signal<SessionStatus>('checking');
  private readonly _user = signal<AuthUser | null>(null);
  private pendingFailure: LoginFailure | null = null;
  private markReady: () => void = () => undefined;
  private readonly ready = new Promise<void>((resolve) => (this.markReady = resolve));

  readonly status = this._status.asReadonly();
  readonly user = this._user.asReadonly();
  readonly isAuthenticated = computed(() => this._status() === 'authenticated');

  constructor() {
    const stop = this.gateway.onSessionEnded(() => this.sessionEnded());
    inject(DestroyRef).onDestroy(stop);
  }

  /**
   * Resolve quando a primeira verificação da sessão termina. Os guards esperam por ela para não
   * mandar ao login quem tem sessão salva (CA7, CA9).
   */
  whenReady(): Promise<void> {
    return this.ready;
  }

  /** Procura uma sessão salva ao abrir o app (CA11). Erro inesperado = sem sessão. */
  async restore(): Promise<void> {
    try {
      const session = await this.gateway.restoreSession();
      this.pendingFailure = session.failure ?? null;
      this.setUser(session.user);
    } catch {
      this.setUser(null);
    } finally {
      this.markReady();
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

  /** Guarda um aviso para a tela de login (ex.: login cancelado na volta do provedor). */
  rememberFailure(failure: LoginFailure): void {
    this.pendingFailure = failure;
  }

  /** Aviso guardado para a tela de login (ex.: sessão expirada). Só é entregue uma vez. */
  consumeFailure(): LoginFailure | null {
    const failure = this.pendingFailure;
    this.pendingFailure = null;
    return failure;
  }

  /** A sessão terminou sem a pessoa ter saído: a tela de login avisa que expirou (CA10). */
  private sessionEnded(): void {
    if (!this.isAuthenticated()) {
      return;
    }
    this.pendingFailure = 'session-expired';
    this.setUser(null);
  }

  private setUser(user: AuthUser | null): void {
    this._user.set(user);
    this._status.set(user ? 'authenticated' : 'anonymous');
  }
}
