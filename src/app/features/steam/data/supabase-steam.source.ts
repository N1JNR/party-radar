import { Injectable, inject } from '@angular/core';

import { SUPABASE } from '../../../core/supabase/supabase.client';
import type { SteamConnectOutcome } from '../domain/steam-connect';
import { NOT_CONNECTED, SteamAccountState, SteamRecheck, SteamSource } from './steam.source';

/** Status HTTP de um erro das Edge Functions (`FunctionsHttpError.context` é a resposta). */
function statusOf(error: unknown): number | null {
  const context = (error as { context?: { status?: unknown } } | null)?.context;
  return typeof context?.status === 'number' ? context.status : null;
}

/** Steam de verdade: lê a própria linha de `steam_accounts` e chama as Edge Functions. */
@Injectable()
export class SupabaseSteamSource implements SteamSource {
  private readonly supabase = inject(SUPABASE);

  /** O RLS só deixa ler a própria linha (CA16), então a consulta não precisa filtrar. */
  async account(): Promise<SteamAccountState> {
    const { data, error } = await this.supabase
      .from('steam_accounts')
      .select('visibility, persona_name, last_synced_at')
      .maybeSingle();
    if (error) {
      throw error;
    }
    if (!data) {
      return NOT_CONNECTED;
    }
    return {
      connected: true,
      visibility:
        data.visibility === 'public' || data.visibility === 'private' ? data.visibility : null,
      personaName: data.persona_name,
      lastSyncedAt: data.last_synced_at,
    };
  }

  async connect(openid: Record<string, string>): Promise<SteamConnectOutcome> {
    const { data, error } = await this.supabase.functions.invoke<{ status?: string }>(
      'steam-connect',
      { body: { openid } },
    );
    if (!error && data?.status === 'connected') {
      return 'connected';
    }
    return statusOf(error) === 409 ? 'taken' : 'failed';
  }

  async recheck(): Promise<SteamRecheck> {
    const { data, error } = await this.supabase.functions.invoke<{
      status?: string;
      visibility?: string;
    }>('steam-sync');
    if (!error && data?.status === 'synced') {
      return data.visibility === 'public' ? 'public' : 'private';
    }
    return 'unavailable';
  }
}
