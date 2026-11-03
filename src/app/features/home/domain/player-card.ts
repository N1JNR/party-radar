export type Platform = 'pc' | 'ps5' | 'xbox' | 'switch' | 'mobile';

export const PLATFORM_LABELS: Record<Platform, string> = {
  pc: 'PC',
  ps5: 'PS5',
  xbox: 'Xbox',
  switch: 'Switch',
  mobile: 'Celular',
};

export interface GameOfMonth {
  name: string;
  hours: number;
}

/** O card do mês atual (spec 002, CA4). */
export interface PlayerCard {
  name: string;
  username: string;
  avatarUrl: string | null;
  /** Jogo aberto agora, ou `null` se a pessoa não está jogando (CA5). */
  playingNow: string | null;
  /** Horas jogadas no mês (spec 003, CA8). */
  monthHours: number;
  /** Mês da conexão: as horas partem das "últimas 2 semanas" da Steam (decisão da spec 003). */
  estimate: boolean;
  /** Nome público na Steam, para "<nome> na Steam" (spec 003, CA21); `null` sem Steam lida. */
  steamName: string | null;
  /** Última leitura da Steam (ISO), para o "Atualizado há <tempo>" (spec 003, CA15). */
  updatedAt: string | null;
  /** Jogos com tempo no mês. */
  games: number;
  gameOfMonth: GameOfMonth | null;
}

/** Frases do card "pobrinho" no lugar dos dados que faltam (CA7). */
export const FIRST_ACCESS_PHRASES = {
  hours: 'Até a geladeira tem mais tempo de tela que você.',
} as const;

/** Aviso do mês da conexão (decisão da spec 003). */
export const ESTIMATE_NOTE = 'Primeiro mês: estimativa a partir das últimas 2 semanas da Steam.';

/** "N1JNR na Steam" (spec 003, CA21); `null` sem nome lido da Steam. */
export function steamNameLabel(steamName: string | null): string | null {
  const name = steamName?.trim();
  return name ? `${name} na Steam` : null;
}

/** A leitura diária falhou quando a última leitura passa disso (ajustes da Parte 3b). */
export const STALE_AFTER_MS = 26 * 60 * 60_000;

/**
 * "Atualizado há 27h", "Atualizado há 3 dias" (spec 003, CA15): só quando a última leitura está
 * velha (a leitura diária falhou). Leitura recente, sem data ou data inválida: `null`.
 */
export function updatedAgoLabel(updatedAt: string | null, now: Date): string | null {
  const time = updatedAt ? Date.parse(updatedAt) : Number.NaN;
  const age = now.getTime() - time;
  if (!Number.isFinite(age) || age <= STALE_AFTER_MS) {
    return null;
  }
  const hours = Math.floor(age / 3_600_000);
  if (hours < 48) {
    return `Atualizado há ${hours}h`;
  }
  return `Atualizado há ${Math.floor(hours / 24)} dias`;
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

/** Texto do status de jogo (CA5): não depende só da cor do anel. */
export function playingLabel(game: string | null): string | null {
  return game ? `Jogando ${game} agora` : null;
}
