// Acesso ao Supabase dentro das Edge Functions. O runtime fornece a URL e as chaves; a secret key
// (service role) só existe aqui no servidor e nunca volta para o app.

import { SupabaseClient, createClient } from 'npm:@supabase/supabase-js@2.118.0';

import { Fetch, readSteam } from './steam-api.ts';
import { ReadingPatch, SteamAccount, SyncDeps } from './steam-link.ts';

function env(name: string): string {
  const value = Deno.env.get(name);
  if (!value) {
    throw new Error(`Variável ${name} não configurada`);
  }
  return value;
}

/** Cliente com a secret key: grava o que o RLS não deixa o app gravar. */
export function adminClient(): SupabaseClient {
  return createClient(env('SUPABASE_URL'), env('SUPABASE_SERVICE_ROLE_KEY'), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** Quem chamou a função, pela sessão do app no cabeçalho `Authorization`; `null` sem sessão. */
export async function callerId(request: Request): Promise<string | null> {
  const authorization = request.headers.get('Authorization');
  if (!authorization) {
    return null;
  }
  const client = createClient(env('SUPABASE_URL'), env('SUPABASE_ANON_KEY'), {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await client.auth.getUser();
  return error || !data.user ? null : data.user.id;
}

/** Origens em que o app roda, de `APP_ORIGINS` (separadas por vírgula). */
export function allowedOrigins(): string[] {
  return env('APP_ORIGINS')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

/** Conta Steam do usuário, ou `null` se ele ainda não conectou. */
export async function accountOf(
  admin: SupabaseClient,
  userId: string,
): Promise<SteamAccount | null> {
  const { data, error } = await admin
    .from('steam_accounts')
    .select('steam_id, baseline_minutes')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) {
    throw error;
  }
  return data ? { userId, steamId: data.steam_id, baselineMinutes: data.baseline_minutes } : null;
}

/** Leitura da Steam (com a chave do servidor) e gravação no banco, para `syncAccount`. */
export function syncDeps(admin: SupabaseClient, fetch: Fetch = globalThis.fetch): SyncDeps {
  const key = env('STEAM_WEB_API_KEY');
  return {
    readSteam: (steamId) => readSteam(fetch, key, steamId),
    saveReading: async (userId: string, patch: ReadingPatch) => {
      const { error } = await admin
        .from('steam_accounts')
        .update({
          persona_name: patch.personaName,
          visibility: patch.visibility,
          current_game: patch.currentGame,
          last_synced_at: patch.lastSyncedAt,
          ...(patch.baselineMinutes === undefined
            ? {}
            : { baseline_minutes: patch.baselineMinutes }),
        })
        .eq('user_id', userId);
      if (error) {
        throw error;
      }
    },
    now: () => new Date(),
  };
}
