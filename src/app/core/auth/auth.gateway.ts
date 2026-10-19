import { InjectionToken } from '@angular/core';

/** Provedores de login aceitos no MVP. */
export type AuthProvider = 'discord' | 'google';

/** Dados públicos de quem está logado (spec 001, CA4). */
export interface AuthUser {
  name: string;
  username: string;
  avatarUrl: string | null;
}

/**
 * Por que o login não foi concluído (spec 001, CA10 e CA13–CA15). `unavailable`: provedor que
 * ainda não está ligado (o Google, até a Parte 2b, CA23).
 */
export type LoginFailure = 'cancelled' | 'failed' | 'offline' | 'session-expired' | 'unavailable';

export type SignInResult = { ok: true; user: AuthUser } | { ok: false; failure: LoginFailure };

/** Resultado de procurar uma sessão salva no aparelho ao abrir o app. */
export interface RestoredSession {
  user: AuthUser | null;
  /** Preenchido quando havia uma sessão, mas ela não pôde ser renovada. */
  failure?: 'session-expired';
}

/**
 * Contrato entre as telas e quem faz o login de fato.
 * Parte 1: implementação simulada. Parte 2: Supabase Auth (`SupabaseAuthGateway`).
 */
export interface AuthGateway {
  restoreSession(): Promise<RestoredSession>;
  /**
   * Inicia o login. Com OAuth real o navegador sai do app e a promessa pode não resolver;
   * ela só resolve quando o login falha antes do redirecionamento (ex.: sem conexão).
   * `redirectTo` é o endereço de volta do provedor, com o destino depois do login (CA5).
   */
  signIn(provider: AuthProvider, redirectTo?: string): Promise<SignInResult>;
  /** Encerra a sessão só neste aparelho (CA8). */
  signOut(): Promise<void>;
  /**
   * Avisa quando a sessão termina sem a pessoa ter tocado em Sair (renovação falhou, saiu em
   * outra aba) (CA10). Devolve a função que cancela o aviso.
   */
  onSessionEnded(listener: () => void): () => void;
}

export const AUTH_GATEWAY = new InjectionToken<AuthGateway>('AUTH_GATEWAY');
