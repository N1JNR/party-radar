// Acesso ao Supabase dentro das Edge Functions. O runtime fornece a URL e as chaves; a secret key
// (service role) só existe aqui no servidor e nunca volta para o app.

import { SupabaseClient, createClient } from 'npm:@supabase/supabase-js@2.118.0';

import { hasBearer } from './http.ts';
import { Fetch, Visibility, readSteam, withTimeout } from './steam-api.ts';
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

/** A volta vale 5 minutos; os nonces ficam 10 e depois são apagados. */
const NONCE_KEEP_MS = 10 * 60_000;

/**
 * Marca a volta da Steam como usada (CA3). Devolve `false` se ela já tinha sido usada. Aproveita
 * para apagar as antigas; se a limpeza falhar, a conexão segue.
 */
export async function useNonce(admin: SupabaseClient, nonce: string): Promise<boolean> {
  const { error } = await admin.from('steam_openid_nonces').insert({ nonce });
  if (error?.code === '23505') {
    return false;
  }
  if (error) {
    throw error;
  }
  await admin
    .from('steam_openid_nonces')
    .delete()
    .lt('used_at', new Date(Date.now() - NONCE_KEEP_MS).toISOString());
  return true;
}

/** Conta Steam do usuário, com a última visibilidade lida, ou `null` se ele ainda não conectou. */
export async function accountOf(
  admin: SupabaseClient,
  userId: string,
): Promise<(SteamAccount & { visibility: Visibility | null }) | null> {
  const { data, error } = await admin
    .from('steam_accounts')
    .select('steam_id, baseline_minutes, visibility')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) {
    throw error;
  }
  if (!data) {
    return null;
  }
  const visibility =
    data.visibility === 'public' || data.visibility === 'private' ? data.visibility : null;
  return { userId, steamId: data.steam_id, baselineMinutes: data.baseline_minutes, visibility };
}

/** Chamada do agendamento do banco: traz a secret key (service role), não a sessão de alguém. */
export function isScheduledCall(request: Request): boolean {
  return hasBearer(request, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'));
}

/** Próximas contas Steam, em ordem de `user_id`, para a leitura agendada (CA14). */
export async function listAccounts(
  admin: SupabaseClient,
  after: string | null,
  limit: number,
): Promise<SteamAccount[]> {
  let query = admin
    .from('steam_accounts')
    .select('user_id, steam_id, baseline_minutes')
    .order('user_id')
    .limit(limit);
  if (after) {
    query = query.gt('user_id', after);
  }
  const { data, error } = await query;
  if (error) {
    throw error;
  }
  return data.map((row) => ({
    userId: row.user_id,
    steamId: row.steam_id,
    baselineMinutes: row.baseline_minutes,
  }));
}

/**
 * Reserva a leitura da Steam (CA20) num `update` só: grava o horário da tentativa se a última
 * foi antes de `before`. Duas chamadas juntas não leem as duas.
 */
export async function claimSync(
  admin: SupabaseClient,
  userId: string,
  before: Date,
): Promise<boolean> {
  const { data, error } = await admin
    .from('steam_accounts')
    .update({ sync_attempted_at: new Date().toISOString() })
    .eq('user_id', userId)
    .or(`sync_attempted_at.is.null,sync_attempted_at.lt.${before.toISOString()}`)
    .select('user_id');
  if (error) {
    throw error;
  }
  return data.length > 0;
}

/** Leitura da Steam (com a chave do servidor) e gravação no banco, para `syncAccount`. */
export function syncDeps(
  admin: SupabaseClient,
  fetch: Fetch = withTimeout(globalThis.fetch),
): SyncDeps {
  const key = env('STEAM_WEB_API_KEY');
  return {
    readSteam: (steamId) => readSteam(fetch, key, steamId),
    saveSnapshots: async (userId, day, games) => {
      const { error } = await admin.from('steam_playtime_snapshots').upsert(
        games.map((game) => ({
          user_id: userId,
          app_id: game.appId,
          game_name: game.name,
          taken_on: day,
          minutes_total: game.minutesTotal,
          minutes_2weeks: game.minutes2Weeks,
        })),
        { onConflict: 'user_id,app_id,taken_on' },
      );
      if (error) {
        throw error;
      }
    },
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
