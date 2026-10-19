import { assertEquals } from 'jsr:@std/assert@1';

import {
  OpenIdParams,
  STEAM_OPENID_ENDPOINT,
  checkAssertion,
  checkAuthenticationBody,
  isValidCheckResponse,
  openIdParams,
} from './steam-openid.ts';

const now = new Date('2026-10-19T18:02:00Z');
const rules = {
  expectedReturnTo: 'http://localhost:4200/steam/retorno',
  now,
  maxAgeMs: 5 * 60_000,
};

// Volta típica da Steam depois de a pessoa confirmar.
function valid(overrides: Record<string, string> = {}): OpenIdParams {
  return {
    ns: 'http://specs.openid.net/auth/2.0',
    mode: 'id_res',
    op_endpoint: STEAM_OPENID_ENDPOINT,
    claimed_id: 'https://steamcommunity.com/openid/id/76561198000000001',
    identity: 'https://steamcommunity.com/openid/id/76561198000000001',
    return_to: 'http://localhost:4200/steam/retorno?next=%2Finicio',
    response_nonce: '2026-10-19T18:00:00ZabcDEF123',
    assoc_handle: '1234567890',
    signed: 'signed,op_endpoint,claimed_id,identity,return_to,response_nonce,assoc_handle',
    sig: 'assinatura=',
    ...overrides,
  };
}

Deno.test('aceita a volta válida e tira o SteamID (CA3)', () => {
  assertEquals(checkAssertion(valid(), rules), { ok: true, steamId: '76561198000000001' });
});

Deno.test('aceita o claimed_id em http, como a Steam documenta', () => {
  const id = 'http://steamcommunity.com/openid/id/76561198000000001';
  assertEquals(checkAssertion(valid({ claimed_id: id, identity: id }), rules).ok, true);
});

Deno.test('recusa resposta que não é positiva (cancelou ou outro modo)', () => {
  assertEquals(checkAssertion(valid({ mode: 'cancel' }), rules), {
    ok: false,
    reason: 'not-positive',
  });
  assertEquals(checkAssertion(valid({ ns: 'http://outro' }), rules), {
    ok: false,
    reason: 'not-positive',
  });
});

Deno.test('recusa resposta de outro provedor', () => {
  assertEquals(checkAssertion(valid({ op_endpoint: 'https://malicioso.test/openid' }), rules), {
    ok: false,
    reason: 'wrong-provider',
  });
});

Deno.test('recusa volta para outro endereço que não o do app', () => {
  for (const return_to of [
    'https://malicioso.test/steam/retorno',
    'http://localhost:4200/outra-rota',
    'não é endereço',
    '',
  ]) {
    assertEquals(checkAssertion(valid({ return_to }), rules), {
      ok: false,
      reason: 'wrong-return',
    });
  }
});

Deno.test('recusa conta que não é da Steam ou identidade diferente', () => {
  const cases: Record<string, string>[] = [
    { claimed_id: 'https://malicioso.test/openid/id/76561198000000001' },
    { claimed_id: 'https://steamcommunity.com/openid/id/123' },
    { identity: 'https://steamcommunity.com/openid/id/76561198000000002' },
  ];
  for (const overrides of cases) {
    assertEquals(checkAssertion(valid(overrides), rules), { ok: false, reason: 'bad-identity' });
  }
});

Deno.test('recusa resposta sem assinatura ou com campos importantes fora da assinatura', () => {
  assertEquals(checkAssertion(valid({ sig: '' }), rules), { ok: false, reason: 'not-signed' });
  assertEquals(checkAssertion(valid({ signed: 'op_endpoint,claimed_id,identity' }), rules), {
    ok: false,
    reason: 'not-signed',
  });
});

Deno.test('recusa resposta antiga, do futuro ou sem horário', () => {
  for (const response_nonce of [
    '2026-10-19T17:50:00Zantigo',
    '2026-10-19T18:10:00Zfuturo',
    'sem-horario',
  ]) {
    assertEquals(checkAssertion(valid({ response_nonce }), rules), {
      ok: false,
      reason: 'expired',
    });
  }
});

Deno.test('openIdParams pega só os campos openid.*', () => {
  const search = new URLSearchParams('openid.mode=id_res&openid.sig=abc&next=%2Finicio');
  assertEquals(openIdParams(search), { mode: 'id_res', sig: 'abc' });
});

Deno.test('check_authentication reenvia os campos com o modo trocado', () => {
  const body = checkAuthenticationBody(valid());
  assertEquals(body.get('openid.mode'), 'check_authentication');
  assertEquals(body.get('openid.sig'), 'assinatura=');
  assertEquals(body.get('openid.claimed_id'), valid().claimed_id);
});

Deno.test('a Steam confirma só com is_valid:true', () => {
  assertEquals(isValidCheckResponse('ns:http://specs.openid.net/auth/2.0\nis_valid:true\n'), true);
  assertEquals(
    isValidCheckResponse('ns:http://specs.openid.net/auth/2.0\nis_valid:false\n'),
    false,
  );
  assertEquals(isValidCheckResponse(''), false);
});
