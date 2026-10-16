import { InjectionToken, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { SupabaseClient, createClient } from '@supabase/supabase-js';

import { environment } from '../../../environments/environment';

export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

export const SUPABASE_CONFIG = new InjectionToken<SupabaseConfig>('SUPABASE_CONFIG', {
  providedIn: 'root',
  factory: () => ({ url: environment.supabaseUrl, anonKey: environment.supabaseAnonKey }),
});

/**
 * Cria o cliente do Supabase.
 * No servidor (SSR) a sessão não é persistida, porque não existe localStorage.
 */
export function createSupabaseClient(config: SupabaseConfig, isBrowser: boolean): SupabaseClient {
  return createClient(config.url, config.anonKey, {
    auth: {
      persistSession: isBrowser,
      autoRefreshToken: isBrowser,
      detectSessionInUrl: isBrowser,
    },
  });
}

export const SUPABASE = new InjectionToken<SupabaseClient>('SUPABASE', {
  providedIn: 'root',
  factory: () =>
    createSupabaseClient(inject(SUPABASE_CONFIG), isPlatformBrowser(inject(PLATFORM_ID))),
});
