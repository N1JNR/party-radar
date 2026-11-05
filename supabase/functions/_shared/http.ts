// Respostas HTTP das Edge Functions do Party Radar (spec 003). O app chama as funções pelo
// navegador, então toda resposta leva os cabeçalhos de CORS e o pedido OPTIONS é respondido aqui.

export const CORS_HEADERS: Readonly<Record<string, string>> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

/** Resposta em JSON com CORS. */
export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json; charset=utf-8' },
  });
}

/**
 * O pedido traz `Authorization: Bearer <secret>`? Compara em tempo constante, para o tempo de
 * resposta não revelar quantos caracteres batem. Sem segredo configurado, nunca bate.
 */
export function hasBearer(request: Request, secret: string | undefined): boolean {
  if (!secret) {
    return false;
  }
  const given = request.headers.get('Authorization') ?? '';
  const expected = `Bearer ${secret}`;
  let diff = given.length ^ expected.length;
  for (let i = 0; i < expected.length; i++) {
    diff |= (given.charCodeAt(i) || 0) ^ expected.charCodeAt(i);
  }
  return diff === 0;
}

/**
 * A chave que o agendamento do banco apresenta. Na nuvem, `SUPABASE_SERVICE_ROLE_KEY` traz a chave nova
 * (`sb_secret_…`), que o portão das funções recusa; o agendamento usa a JWT `service_role`, guardada em
 * `SCHEDULE_KEY`. No Supabase local, as duas são a mesma, e `SCHEDULE_KEY` não precisa existir.
 */
export function scheduleKey(read: (name: string) => string | undefined): string | undefined {
  return read('SCHEDULE_KEY') || read('SUPABASE_SERVICE_ROLE_KEY');
}

/** Responde o pedido de pré-voo (OPTIONS) do navegador; para os outros, devolve `null`. */
export function preflight(request: Request): Response | null {
  return request.method === 'OPTIONS'
    ? new Response(null, { status: 204, headers: CORS_HEADERS })
    : null;
}
