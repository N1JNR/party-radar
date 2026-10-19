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

/** Responde o pedido de pré-voo (OPTIONS) do navegador; para os outros, devolve `null`. */
export function preflight(request: Request): Response | null {
  return request.method === 'OPTIONS'
    ? new Response(null, { status: 204, headers: CORS_HEADERS })
    : null;
}
