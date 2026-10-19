// Edge Function steam-connect (spec 003, CA2–CA5): recebe a volta do "Entrar pela Steam" que o
// app pegou na URL, confere com a Steam e liga a conta ao perfil de quem chamou.

import { json, preflight } from '../_shared/http.ts';
import { connectSteam } from '../_shared/steam-link.ts';
import {
  STEAM_OPENID_ENDPOINT,
  checkAuthenticationBody,
  isValidCheckResponse,
} from '../_shared/steam-openid.ts';
import { adminClient, allowedOrigins, callerId, syncDeps } from '../_shared/supabase.ts';

Deno.serve(async (request) => {
  const early = preflight(request);
  if (early) {
    return early;
  }
  if (request.method !== 'POST') {
    return json({ error: 'method-not-allowed' }, 405);
  }
  const userId = await callerId(request);
  if (!userId) {
    return json({ error: 'unauthorized' }, 401);
  }
  let params: Record<string, string>;
  try {
    const body = await request.json();
    params = body?.openid && typeof body.openid === 'object' ? body.openid : null;
  } catch {
    return json({ status: 'invalid' }, 400);
  }
  if (!params) {
    return json({ status: 'invalid' }, 400);
  }

  const admin = adminClient();
  try {
    const result = await connectSteam(
      {
        ...syncDeps(admin),
        allowedOrigins: allowedOrigins(),
        confirmWithSteam: async (openid) => {
          const response = await fetch(STEAM_OPENID_ENDPOINT, {
            method: 'POST',
            body: checkAuthenticationBody(openid),
          });
          return response.ok && isValidCheckResponse(await response.text());
        },
        linkAccount: async (id, steamId) => {
          const { data: owner, error: findError } = await admin
            .from('steam_accounts')
            .select('user_id')
            .eq('steam_id', steamId)
            .maybeSingle();
          if (findError) {
            throw findError;
          }
          if (owner && owner.user_id !== id) {
            return 'taken';
          }
          const { error } = await admin
            .from('steam_accounts')
            .upsert(
              { user_id: id, steam_id: steamId, baseline_minutes: null, last_synced_at: null },
              { onConflict: 'user_id' },
            );
          // Dois perfis ligando a mesma conta ao mesmo tempo: o segundo cai no SteamID único.
          if (error?.code === '23505') {
            return 'taken';
          }
          if (error) {
            throw error;
          }
          return 'linked';
        },
      },
      userId,
      params,
    );
    const status = result.status === 'connected' ? 200 : result.status === 'taken' ? 409 : 400;
    return json(result, status);
  } catch (error) {
    console.error('steam-connect falhou', error);
    return json({ status: 'error' }, 500);
  }
});
