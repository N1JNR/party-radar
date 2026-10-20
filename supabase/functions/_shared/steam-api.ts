// Leitura da Steam Web API (spec 003, CA6 e CA15). A chave fica só no servidor (CA17). O `fetch`
// é recebido de fora para os testes rodarem sem rede.

const API = 'https://api.steampowered.com';

export type Fetch = (url: string) => Promise<Response>;

/** Quanto esperar a Steam antes de desistir (CA20). */
export const STEAM_TIMEOUT_MS = 10_000;

/** `fetch` que desiste depois de `ms`: a Steam lenta não prende a função (CA20). */
export function withTimeout(
  fetch: (url: string, init?: RequestInit) => Promise<Response>,
  ms = STEAM_TIMEOUT_MS,
): (url: string, init?: RequestInit) => Promise<Response> {
  return (url, init = {}) => fetch(url, { ...init, signal: AbortSignal.timeout(ms) });
}

export type Visibility = 'public' | 'private';

export interface SteamGame {
  appId: number;
  name: string;
  /** Tempo total jogado, em minutos (`playtime_forever`). */
  minutesTotal: number;
  /** Tempo jogado nas últimas 2 semanas, em minutos (`playtime_2weeks`). */
  minutes2Weeks: number;
}

export interface SteamReading {
  personaName: string | null;
  /** Privado quando o perfil ou os detalhes de jogos não estão públicos (CA6). */
  visibility: Visibility;
  /** Jogo aberto agora, se o perfil é público e a pessoa está jogando. */
  currentGame: string | null;
  /** Vazio quando os detalhes de jogos são privados. */
  games: SteamGame[];
}

/** A Steam não respondeu direito (fora do ar, erro HTTP, JSON inválido) (CA15). */
export class SteamUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SteamUnavailableError';
  }
}

interface PlayerSummary {
  steamid?: string;
  personaname?: string;
  communityvisibilitystate?: number;
  gameextrainfo?: string;
}

interface OwnedGame {
  appid?: number;
  name?: string;
  playtime_forever?: number;
  playtime_2weeks?: number;
}

const minutes = (value: unknown) =>
  typeof value === 'number' && value > 0 ? Math.floor(value) : 0;

async function getJson(fetch: Fetch, url: string): Promise<unknown> {
  let response: Response;
  try {
    response = await fetch(url);
  } catch (error) {
    throw new SteamUnavailableError(`Steam fora do alcance: ${String(error)}`);
  }
  if (!response.ok) {
    throw new SteamUnavailableError(`Steam respondeu ${response.status}`);
  }
  try {
    return await response.json();
  } catch {
    throw new SteamUnavailableError('Steam respondeu algo que não é JSON');
  }
}

/** Perfil de uma conta: `communityvisibilitystate` 3 é público; qualquer outro valor, privado. */
export function parsePlayerSummary(
  body: unknown,
  steamId: string,
): { personaName: string | null; visibility: Visibility; currentGame: string | null } | null {
  const players = (body as { response?: { players?: PlayerSummary[] } })?.response?.players;
  const player = Array.isArray(players) ? players.find((p) => p.steamid === steamId) : undefined;
  if (!player) {
    return null;
  }
  const visibility: Visibility = player.communityvisibilitystate === 3 ? 'public' : 'private';
  return {
    personaName: player.personaname ?? null,
    visibility,
    currentGame: visibility === 'public' ? (player.gameextrainfo ?? null) : null,
  };
}

/**
 * Jogos de uma conta. A Steam responde `{"response":{}}` quando os detalhes de jogos são
 * privados: aí devolve `null`. Com `game_count` 0, a lista vem vazia, mas é pública.
 */
export function parseOwnedGames(body: unknown): SteamGame[] | null {
  const response = (body as { response?: { game_count?: number; games?: OwnedGame[] } })?.response;
  if (!response || typeof response.game_count !== 'number') {
    return null;
  }
  return (response.games ?? [])
    .filter((game) => typeof game.appid === 'number')
    .map((game) => ({
      appId: game.appid as number,
      name: game.name ?? `App ${game.appid}`,
      minutesTotal: minutes(game.playtime_forever),
      minutes2Weeks: minutes(game.playtime_2weeks),
    }));
}

/** Soma das "últimas 2 semanas" de todos os jogos: o ponto de partida do primeiro mês. */
export function recentMinutes(games: readonly SteamGame[]): number {
  return games.reduce((total, game) => total + game.minutes2Weeks, 0);
}

/** Lê perfil e jogos de uma conta. Conta inexistente ou Steam instável lançam erro. */
export async function readSteam(fetch: Fetch, key: string, steamId: string): Promise<SteamReading> {
  const query = (params: Record<string, string>) =>
    new URLSearchParams({ key, format: 'json', ...params }).toString();
  const summaryBody = await getJson(
    fetch,
    `${API}/ISteamUser/GetPlayerSummaries/v0002/?${query({ steamids: steamId })}`,
  );
  const summary = parsePlayerSummary(summaryBody, steamId);
  if (!summary) {
    throw new SteamUnavailableError('A Steam não encontrou a conta');
  }
  if (summary.visibility === 'private') {
    return { ...summary, games: [] };
  }
  const gamesBody = await getJson(
    fetch,
    `${API}/IPlayerService/GetOwnedGames/v0001/?${query({
      steamid: steamId,
      include_appinfo: 'true',
      include_played_free_games: 'true',
    })}`,
  );
  const games = parseOwnedGames(gamesBody);
  return games === null
    ? { ...summary, visibility: 'private', currentGame: null, games: [] }
    : { ...summary, games };
}
