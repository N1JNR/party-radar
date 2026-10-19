// "Entrar pela Steam" (OpenID 2.0) do lado do servidor (spec 003, CA3). A volta da Steam chega
// pelo navegador e pode ser forjada; ela só vale depois de passar por estas regras e pela
// conferência `check_authentication` com a própria Steam.

export const STEAM_OPENID_ENDPOINT = 'https://steamcommunity.com/openid/login';
const OPENID_NS = 'http://specs.openid.net/auth/2.0';
const CLAIMED_ID = /^https?:\/\/steamcommunity\.com\/openid\/id\/([0-9]{17})$/;
/** Campos que a Steam precisa ter assinado para a resposta valer. */
const REQUIRED_SIGNED = ['op_endpoint', 'claimed_id', 'identity', 'return_to', 'response_nonce'];

export type OpenIdParams = Readonly<Record<string, string>>;

export type AssertionCheck =
  | { ok: true; steamId: string }
  | {
      ok: false;
      reason:
        | 'not-positive'
        | 'wrong-provider'
        | 'wrong-return'
        | 'bad-identity'
        | 'not-signed'
        | 'expired';
    };

export interface AssertionRules {
  /** Endereço de volta esperado (origem + caminho), ex.: `http://localhost:4200/steam/retorno`. */
  expectedReturnTo: string;
  now: Date;
  /** Idade máxima da resposta (o `response_nonce` traz o horário em que a Steam respondeu). */
  maxAgeMs: number;
}

/** Só os parâmetros `openid.*`, sem o prefixo. Outros parâmetros da URL são ignorados. */
export function openIdParams(search: URLSearchParams): OpenIdParams {
  const params: Record<string, string> = {};
  for (const [key, value] of search) {
    if (key.startsWith('openid.')) {
      params[key.slice('openid.'.length)] = value;
    }
  }
  return params;
}

function sameReturn(returnTo: string, expected: string): boolean {
  try {
    const actual = new URL(returnTo);
    const wanted = new URL(expected);
    return actual.origin === wanted.origin && actual.pathname === wanted.pathname;
  } catch {
    return false;
  }
}

function nonceTime(nonce: string): number {
  // Formato do OpenID 2.0: "2026-10-19T18:00:00Z" seguido de caracteres únicos.
  const match = /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z)/.exec(nonce);
  return match ? Date.parse(match[1]) : Number.NaN;
}

/**
 * Regras locais da resposta da Steam, antes de perguntar à Steam se a assinatura vale: resposta
 * positiva, da Steam, para o endereço do app, com uma conta Steam válida, com os campos
 * importantes assinados e recente.
 */
export function checkAssertion(params: OpenIdParams, rules: AssertionRules): AssertionCheck {
  if (params['ns'] !== OPENID_NS || params['mode'] !== 'id_res') {
    return { ok: false, reason: 'not-positive' };
  }
  if (params['op_endpoint'] !== STEAM_OPENID_ENDPOINT) {
    return { ok: false, reason: 'wrong-provider' };
  }
  if (!params['return_to'] || !sameReturn(params['return_to'], rules.expectedReturnTo)) {
    return { ok: false, reason: 'wrong-return' };
  }
  const match = CLAIMED_ID.exec(params['claimed_id'] ?? '');
  if (!match || params['identity'] !== params['claimed_id']) {
    return { ok: false, reason: 'bad-identity' };
  }
  const signed = (params['signed'] ?? '').split(',');
  if (!params['sig'] || REQUIRED_SIGNED.some((field) => !signed.includes(field))) {
    return { ok: false, reason: 'not-signed' };
  }
  const answeredAt = nonceTime(params['response_nonce'] ?? '');
  const age = rules.now.getTime() - answeredAt;
  // Até 1 minuto "no futuro" cobre relógios um pouco diferentes.
  if (Number.isNaN(answeredAt) || age > rules.maxAgeMs || age < -60_000) {
    return { ok: false, reason: 'expired' };
  }
  return { ok: true, steamId: match[1] };
}

/** Corpo do pedido `check_authentication`: os mesmos campos, com o modo trocado. */
export function checkAuthenticationBody(params: OpenIdParams): URLSearchParams {
  const body = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    body.set(`openid.${key}`, key === 'mode' ? 'check_authentication' : value);
  }
  return body;
}

/** A Steam responde em linhas `chave:valor`; a resposta vale só com `is_valid:true`. */
export function isValidCheckResponse(text: string): boolean {
  return text.split('\n').some((line) => line.trim() === 'is_valid:true');
}
