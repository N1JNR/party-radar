import { assertEquals } from 'jsr:@std/assert@1';

import { CORS_HEADERS, hasBearer, json, preflight } from './http.ts';

Deno.test('json devolve o corpo em JSON, o status e os cabeçalhos de CORS', async () => {
  const response = json({ ok: true }, 201);
  assertEquals(response.status, 201);
  assertEquals(response.headers.get('Content-Type'), 'application/json; charset=utf-8');
  assertEquals(
    response.headers.get('Access-Control-Allow-Origin'),
    CORS_HEADERS['Access-Control-Allow-Origin'],
  );
  assertEquals(await response.json(), { ok: true });
});

Deno.test('json usa 200 por padrão', () => {
  assertEquals(json(null).status, 200);
});

Deno.test('preflight responde o OPTIONS do navegador com CORS e sem corpo', async () => {
  const response = preflight(new Request('http://localhost/x', { method: 'OPTIONS' }));
  assertEquals(response?.status, 204);
  assertEquals(response?.headers.get('Access-Control-Allow-Methods'), 'POST, OPTIONS');
  assertEquals(await response?.text(), '');
});

Deno.test('preflight ignora os outros métodos', () => {
  assertEquals(preflight(new Request('http://localhost/x', { method: 'POST' })), null);
});

Deno.test('hasBearer reconhece só o segredo exato no Authorization', () => {
  const pedido = (authorization?: string) =>
    new Request('http://x', authorization ? { headers: { Authorization: authorization } } : {});
  assertEquals(hasBearer(pedido('Bearer segredo-123'), 'segredo-123'), true);
  assertEquals(hasBearer(pedido('Bearer segredo-12'), 'segredo-123'), false);
  assertEquals(hasBearer(pedido('Bearer segredo-1234'), 'segredo-123'), false);
  assertEquals(hasBearer(pedido('segredo-123'), 'segredo-123'), false);
  assertEquals(hasBearer(pedido(), 'segredo-123'), false);
  assertEquals(hasBearer(pedido('Bearer '), ''), false);
  assertEquals(hasBearer(pedido('Bearer undefined'), undefined), false);
});
