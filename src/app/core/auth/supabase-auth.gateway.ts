import { DOCUMENT, Injectable, inject } from '@angular/core';
import { isAuthRetryableFetchError } from '@supabase/supabase-js';

import { SUPABASE } from '../supabase/supabase.client';
import { AuthGateway, AuthProvider, AuthUser, RestoredSession, SignInResult } from './auth.gateway';

/** Promessa que nunca termina: com o OAuth, o navegador sai do app antes de haver resposta. */
function leavingApp(): Promise<never> {
  return new Promise<never>(() => undefined);
}

/**
 * Login de verdade pelo Supabase Auth (spec 001, Parte 2a): Discord com PKCE. O Google fica
 * "em breve" até a Parte 2b (CA23).
 */
@Injectable()
export class SupabaseAuthGateway implements AuthGateway {
  private readonly supabase = inject(SUPABASE);
  private readonly document = inject(DOCUMENT);
  /** Enquanto a própria pessoa sai, o fim da sessão não é "sessão expirada". */
  private signingOut = false;

  async restoreSession(): Promise<RestoredSession> {
    const { data, error } = await this.supabase.auth.getSession();
    if (error) {
      // Sem internet, a sessão continua guardada; só uma renovação recusada é "expirou" (CA10).
      return isAuthRetryableFetchError(error)
        ? { user: null }
        : { user: null, failure: 'session-expired' };
    }
    if (!data.session) {
      return { user: null };
    }
    return { user: await this.profileOf(data.session.user.id) };
  }

  async signIn(provider: AuthProvider, redirectTo?: string): Promise<SignInResult> {
    if (provider !== 'discord') {
      return { ok: false, failure: 'unavailable' };
    }
    if (this.document.defaultView?.navigator.onLine === false) {
      return { ok: false, failure: 'offline' };
    }
    const { error } = await this.supabase.auth.signInWithOAuth({
      provider: 'discord',
      options: { redirectTo },
    });
    if (error) {
      return { ok: false, failure: 'failed' };
    }
    return leavingApp();
  }

  async signOut(): Promise<void> {
    this.signingOut = true;
    try {
      const { error } = await this.supabase.auth.signOut({ scope: 'local' });
      if (error) {
        throw error;
      }
    } finally {
      this.signingOut = false;
    }
  }

  onSessionEnded(listener: () => void): () => void {
    const { data } = this.supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT' && !this.signingOut) {
        listener();
      }
    });
    return () => data.subscription.unsubscribe();
  }

  /** Nome, @usuário e foto vêm do perfil criado no cadastro (CA4). */
  private async profileOf(userId: string): Promise<AuthUser> {
    const { data, error } = await this.supabase
      .from('profiles')
      .select('display_name, username, avatar_url')
      .eq('id', userId)
      .single();
    if (error) {
      throw error;
    }
    return { name: data.display_name, username: data.username, avatarUrl: data.avatar_url };
  }
}
