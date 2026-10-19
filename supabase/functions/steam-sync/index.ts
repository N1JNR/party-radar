// Edge Function steam-sync (spec 003, CA6 e CA7): lê de novo a Steam de quem chamou. É o
// "Já deixei público" e o "Tentar de novo"; a leitura de todas as contas, agendada, vem na 3b.

import { json, preflight } from '../_shared/http.ts';
import { syncAccount } from '../_shared/steam-link.ts';
import { accountOf, adminClient, callerId, syncDeps } from '../_shared/supabase.ts';

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

  const admin = adminClient();
  try {
    const account = await accountOf(admin, userId);
    if (!account) {
      return json({ status: 'not-connected' }, 404);
    }
    const result = await syncAccount(syncDeps(admin), account);
    return json(result, result.status === 'synced' ? 200 : 503);
  } catch (error) {
    console.error('steam-sync falhou', error);
    return json({ status: 'error' }, 500);
  }
});
