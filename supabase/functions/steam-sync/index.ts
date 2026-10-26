// Edge Function steam-sync (spec 003, CA6, CA7, CA14, CA19 e CA20). Dois jeitos de chamar:
// - pelo app, com a sessão de quem está logado: lê de novo a Steam dessa pessoa, no máximo a cada
//   30 segundos ("Já deixei público" e "Tentar de novo");
// - pelo agendamento do banco, com a secret key: lê todas as contas, uma vez por dia (CA14).

import { json, preflight } from '../_shared/http.ts';
import { recheckAccount, syncAllAccounts } from '../_shared/steam-link.ts';
import {
  accountOf,
  adminClient,
  callerId,
  claimSync,
  isScheduledCall,
  listAccounts,
  syncDeps,
} from '../_shared/supabase.ts';

Deno.serve(async (request) => {
  const early = preflight(request);
  if (early) {
    return early;
  }
  if (request.method !== 'POST') {
    return json({ error: 'method-not-allowed' }, 405);
  }

  if (isScheduledCall(request)) {
    const admin = adminClient();
    try {
      const result = await syncAllAccounts({
        ...syncDeps(admin),
        listAccounts: (after, limit) => listAccounts(admin, after, limit),
        onAccountError: (userId, error) =>
          console.error('steam-sync agendado: falhou para uma conta', userId, error),
      });
      return json({ status: 'done', ...result });
    } catch (error) {
      console.error('steam-sync agendado falhou', error);
      return json({ status: 'error' }, 500);
    }
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
    const result = await recheckAccount(
      { ...syncDeps(admin), claimSync: (id, before) => claimSync(admin, id, before) },
      account,
    );
    return json(result, result.status === 'synced' ? 200 : 503);
  } catch (error) {
    console.error('steam-sync falhou', error);
    return json({ status: 'error' }, 500);
  }
});
