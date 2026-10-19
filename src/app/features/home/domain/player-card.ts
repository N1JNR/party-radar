import { PlayStats } from './patentes';

export type Platform = 'pc' | 'ps5' | 'xbox' | 'switch' | 'mobile';

export const PLATFORM_LABELS: Record<Platform, string> = {
  pc: 'PC',
  ps5: 'PS5',
  xbox: 'Xbox',
  switch: 'Switch',
  mobile: 'Celular',
};

export interface PlatformHours {
  platform: Platform;
  hours: number;
}

export interface PlatformShare {
  platform: Platform;
  label: string;
  /** Inteiro de 0 a 100; a soma das fatias é sempre 100. */
  percent: number;
}

export interface GameOfMonth {
  name: string;
  hours: number;
}

/** Com quem a pessoa mais jogou no mês. */
export interface SquadPartner {
  name: string;
  avatarUrl: string | null;
  matches: number;
  /** Parceria detectada por sinais indiretos e ainda não confirmada (CA6). */
  probable: boolean;
}

/** O card do mês atual (spec 002, CA4). */
export interface PlayerCard {
  name: string;
  username: string;
  avatarUrl: string | null;
  /** Jogo aberto agora, ou `null` se a pessoa não está jogando (CA5). */
  playingNow: string | null;
  /** Título do mês, ex.: "Sofredor de Souls". `null` quando ainda não há dados. */
  title: string | null;
  stats: PlayStats;
  games: number;
  gameOfMonth: GameOfMonth | null;
  partner: SquadPartner | null;
  platforms: PlatformHours[];
}

/** Frases do card "pobrinho" no lugar dos dados que faltam (CA7). */
export const FIRST_ACCESS_PHRASES = {
  hours: 'Até a geladeira tem mais tempo de tela que você.',
  gameOfMonth: 'Nenhum. Ainda.',
  partner: 'Nem o bot quer duo.',
  platform: 'Plataforma: um mistério.',
} as const;

/** Sem horas e sem jogos: o card mostra a versão de primeiro acesso. */
export function isFirstAccess(card: PlayerCard): boolean {
  return !(card.stats.hours > 0) && !(card.games > 0);
}

/**
 * Divide as horas por plataforma em porcentagens inteiras que somam 100 (maiores restos), da
 * maior para a menor. Plataformas sem horas ficam de fora.
 */
export function platformShares(platforms: readonly PlatformHours[]): PlatformShare[] {
  const valid = platforms.filter((p) => Number.isFinite(p.hours) && p.hours > 0);
  const total = valid.reduce((sum, p) => sum + p.hours, 0);
  if (total === 0) {
    return [];
  }
  const raw = valid.map((p) => {
    const exact = (p.hours / total) * 100;
    return { platform: p.platform, percent: Math.floor(exact), remainder: exact % 1 };
  });
  let missing = 100 - raw.reduce((sum, p) => sum + p.percent, 0);
  for (const slice of [...raw].sort((a, b) => b.remainder - a.remainder)) {
    if (missing === 0) {
      break;
    }
    slice.percent += 1;
    missing -= 1;
  }
  return raw
    .sort((a, b) => b.percent - a.percent)
    .map(({ platform, percent }) => ({ platform, label: PLATFORM_LABELS[platform], percent }));
}

/** "0h", "45min", "1h30", "42h". Acima de 10h, só as horas cheias. */
export function formatHours(hours: number): string {
  const minutes = Number.isFinite(hours) && hours > 0 ? Math.round(hours * 60) : 0;
  const whole = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (whole === 0 && rest > 0) {
    return `${rest}min`;
  }
  if (rest === 0 || whole >= 10) {
    return `${whole}h`;
  }
  return `${whole}h${String(rest).padStart(2, '0')}`;
}

/** "1 jogo", "7 jogos". */
export function gamesLabel(games: number): string {
  return games === 1 ? '1 jogo' : `${Math.max(0, games)} jogos`;
}

/** "1 partida juntos", "18 partidas juntos". */
export function matchesLabel(matches: number): string {
  return matches === 1 ? '1 partida juntos' : `${Math.max(0, matches)} partidas juntos`;
}

/** Texto do status de jogo (CA5): não depende só da cor do anel. */
export function playingLabel(game: string | null): string | null {
  return game ? `Jogando ${game} agora` : null;
}
