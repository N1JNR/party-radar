// Tipo de um jogo pelo gênero da loja da Steam (spec 004, CA7 e CA8). A loja não tem contrato oficial
// e tem limite informal, então cada jogo é consultado uma vez só, e falha nunca derruba a leitura.

import { Fetch, SteamGame } from './steam-api.ts';

const STORE = 'https://store.steampowered.com/api/appdetails';

export type GameCategory = 'esporte' | 'corrida' | 'simulacao' | 'rpg' | 'aventura' | 'outros';

/** Jogos consultados por leitura: o limite informal da loja é de cerca de 200 a cada 5 minutos. */
export const MAX_STORE_LOOKUPS = 20;

/**
 * Do gênero (em inglês) para o tipo, na ordem de prioridade. "Action" não decide nada, porque a loja
 * chama quase todo jogo de ação, e Tiro e Arcade não existem como gênero: esses vêm da lista curada.
 */
const BY_GENRE: readonly (readonly [string, GameCategory])[] = [
  ['Racing', 'corrida'],
  ['Sports', 'esporte'],
  ['RPG', 'rpg'],
  ['Simulation', 'simulacao'],
  ['Adventure', 'aventura'],
];

/** Tipo a partir dos gêneros da loja; sem nenhum que decida, "outros". */
export function categoryFromGenres(genres: readonly string[]): GameCategory {
  return BY_GENRE.find(([genre]) => genres.includes(genre))?.[1] ?? 'outros';
}

/**
 * Lê os gêneros de um jogo na loja. Devolve `null` quando a loja falhou ou não respondeu direito: aí
 * nada é gravado, e a próxima leitura tenta de novo (CA8). Jogo removido da loja devolve lista vazia.
 */
export async function readStoreGenres(fetch: Fetch, appId: number): Promise<string[] | null> {
  try {
    const response = await fetch(`${STORE}?appids=${appId}&filters=genres&l=english`);
    if (!response.ok) {
      return null;
    }
    const entry = ((await response.json()) as Record<string, unknown>)?.[String(appId)] as
      { success?: boolean; data?: { genres?: { description?: unknown }[] } } | undefined;
    if (!entry || typeof entry.success !== 'boolean') {
      return null;
    }
    return (entry.data?.genres ?? [])
      .map((genre) => genre.description)
      .filter((name): name is string => typeof name === 'string');
  } catch {
    return null;
  }
}

/** Jogos a classificar nesta leitura: os jogados, sem tipo ainda, de mais horas primeiro. */
export function gamesToClassify(
  games: readonly SteamGame[],
  known: ReadonlySet<number>,
  limit = MAX_STORE_LOOKUPS,
): SteamGame[] {
  return games
    .filter((game) => game.minutesTotal > 0 && !known.has(game.appId))
    .sort((a, b) => b.minutesTotal - a.minutesTotal)
    .slice(0, limit);
}
