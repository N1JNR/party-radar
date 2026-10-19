/** Página de login da própria Steam (OpenID 2.0). O Party Radar nunca vê a senha. */
export const STEAM_OPENID_LOGIN = 'https://steamcommunity.com/openid/login';

/** Rota do app que recebe a volta da Steam (spec 003, CA2). */
export const STEAM_RETURN_PATH = '/steam/retorno';

const OPENID_NS = 'http://specs.openid.net/auth/2.0';
const IDENTIFIER_SELECT = 'http://specs.openid.net/auth/2.0/identifier_select';

/** Endereço de ida para a Steam: a pessoa escolhe a conta lá e volta para `/steam/retorno`. */
export function steamLoginUrl(origin: string): string {
  const params = new URLSearchParams({
    'openid.ns': OPENID_NS,
    'openid.mode': 'checkid_setup',
    'openid.return_to': `${origin}${STEAM_RETURN_PATH}`,
    'openid.realm': origin,
    'openid.identity': IDENTIFIER_SELECT,
    'openid.claimed_id': IDENTIFIER_SELECT,
  });
  return `${STEAM_OPENID_LOGIN}?${params.toString()}`;
}

/** Os campos `openid.*` da volta, sem o prefixo, para o servidor conferir com a Steam. */
export function openIdFromSearch(search: string): Record<string, string> {
  const params: Record<string, string> = {};
  for (const [key, value] of new URLSearchParams(search)) {
    if (key.startsWith('openid.')) {
      params[key.slice('openid.'.length)] = value;
    }
  }
  return params;
}

/** Como terminou a tentativa de conectar. */
export type SteamConnectOutcome = 'connected' | 'taken' | 'failed';

/**
 * Volta da Steam sem resposta positiva (cancelou, ou chegou sem os dados): não vale nem mandar
 * para o servidor.
 */
export function isPositiveReturn(openid: Record<string, string>): boolean {
  return openid['mode'] === 'id_res' && Boolean(openid['claimed_id']) && Boolean(openid['sig']);
}

/** Aviso mostrado no Meu card depois de tentar conectar (CA4, CA5). */
export function connectMessage(outcome: SteamConnectOutcome): string {
  switch (outcome) {
    case 'connected':
      return 'Steam conectada.';
    case 'taken':
      return 'Essa conta Steam já está ligada a outro perfil.';
    case 'failed':
      return 'Não foi possível conectar a Steam. Tente de novo.';
  }
}

/** "Já deixei público" com o perfil ainda privado (CA7). */
export const STILL_PRIVATE_MESSAGE =
  'Ainda está privado. Confira os dois itens na Steam e tente de novo.';
