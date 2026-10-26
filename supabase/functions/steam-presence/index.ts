// Edge Function steam-presence (spec 003, CA10): "jogando agora" de todas as contas, chamada só
// pelo agendamento do banco (a cada 5 minutos), com a secret key.

import { json, preflight } from '../_shared/http.ts';
import { refreshPresence } from '../_shared/steam-presence.ts';
import { adminClient, isScheduledCall, presenceDeps } from '../_shared/supabase.ts';

Deno.serve(async (request) => {
  const early = preflight(request);
  if (early) {
    return early;
  }
  if (request.method !== 'POST') {
    return json({ error: 'method-not-allowed' }, 405);
  }
  if (!isScheduledCall(request)) {
    return json({ error: 'unauthorized' }, 401);
  }
  try {
    const result = await refreshPresence(presenceDeps(adminClient()));
    return json({ status: 'done', ...result });
  } catch (error) {
    console.error('steam-presence falhou', error);
    return json({ status: 'error' }, 500);
  }
});
