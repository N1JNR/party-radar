import { InjectionToken, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { SupabaseClient, createClient } from '@supabase/supabase-js';

import { environment } from '../../../environments/environment';
import { AUTH_SESSION_STORAGE, KeyValueStorage } from '../platform/auth-session-storage';

export interface SupabaseConfig {
  url: string;
  publishableKey: string;
}

export const SUPABASE_CONFIG = new InjectionToken<SupabaseConfig>('SUPABASE_CONFIG', {
  providedIn: 'root',
  factory: () => ({
    url: environment.supabaseUrl,
    publishableKey: environment.supabasePublishableKey,
  }),
});

/**
 * Cria o cliente do Supabase.
 * No servidor (SSR) a sessão não é persistida, porque não existe localStorage.
 * O login usa PKCE: o provedor devolve um código, trocado pela sessão no navegador.
 * A sessão é gravada sem os tokens do provedor (spec 001, CA17).
 */
export function createSupabaseClient(
  config: SupabaseConfig,
  isBrowser: boolean,
  storage: KeyValueStorage,
): SupabaseClient {
  return createClient(config.url, config.publishableKey, {
    auth: {
      flowType: 'pkce',
      storage,
      persistSession: isBrowser,
      autoRefreshToken: isBrowser,
      detectSessionInUrl: isBrowser,
    },
  });
}

export const SUPABASE = new InjectionToken<SupabaseClient>('SUPABASE', {
  providedIn: 'root',
  factory: () =>
    createSupabaseClient(
      inject(SUPABASE_CONFIG),
      isPlatformBrowser(inject(PLATFORM_ID)),
      inject(AUTH_SESSION_STORAGE),
    ),
});
