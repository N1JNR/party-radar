/** Tipos de jogo do radar, na ordem dos eixos (spec 004). "Outros" não vira eixo. */
export type GameCategory =
  'tiro' | 'esporte' | 'corrida' | 'simulacao' | 'arcade' | 'rpg' | 'aventura';

export type GameKind = GameCategory | 'outros';

export const RADAR_AXES: readonly GameCategory[] = [
  'tiro',
  'esporte',
  'corrida',
  'simulacao',
  'arcade',
  'rpg',
  'aventura',
];

export const KIND_LABELS: Record<GameKind, string> = {
  tiro: 'Tiro',
  esporte: 'Esporte',
  corrida: 'Corrida',
  simulacao: 'Simulação',
  arcade: 'Arcade',
  rpg: 'RPG',
  aventura: 'Aventura',
  outros: 'Outros',
};

/** Título de cada tipo; a ordem da lista também desempata (CA5). */
const TITLES: readonly (readonly [GameCategory, string])[] = [
  ['tiro', 'Atirador nato'],
  ['esporte', 'Craque de sofá'],
  ['corrida', 'Pé no fundo'],
  ['simulacao', 'Mestre da simulação'],
  ['arcade', 'Rei do fliperama'],
  ['rpg', 'Viciado em side quest'],
  ['aventura', 'Explorador sem mapa'],
];

export const VERSATILE_TITLE = 'Jogador versátil';

/** Porcentagem das horas para um tipo dar o título (CA5). */
export const TITLE_THRESHOLD = 40;

export type RadarPeriod = 'all' | 'month';

/** Um jogo de quem está logado, com horas por período. */
export interface PlayedGame {
  appId: number;
  name: string;
  kind: GameKind;
  totalHours: number;
  monthHours: number;
  previousMonthHours: number;
}

const hoursIn = (game: PlayedGame, period: RadarPeriod): number => {
  const hours = period === 'all' ? game.totalHours : game.monthHours;
  return Number.isFinite(hours) && hours > 0 ? hours : 0;
};

/** Jogos com tempo no período, do mais jogado ao menos. */
export function gamesIn(games: readonly PlayedGame[], period: RadarPeriod): PlayedGame[] {
  return games
    .filter((game) => hoursIn(game, period) > 0)
    .sort((a, b) => hoursIn(b, period) - hoursIn(a, period));
}

/** Horas somadas do período. */
export function totalHours(games: readonly PlayedGame[], period: RadarPeriod): number {
  return games.reduce((sum, game) => sum + hoursIn(game, period), 0);
}

/** "1 jogo", "14 jogos": só os com tempo no período (CA9). */
export function gameCount(games: readonly PlayedGame[], period: RadarPeriod): number {
  return gamesIn(games, period).length;
}

export interface KindShare {
  kind: GameKind;
  label: string;
  hours: number;
  /** Inteiro de 0 a 100; a soma dá 100 quando há horas (CA2). */
  percent: number;
}

/**
 * Horas e porcentagem de cada tipo, com "Outros" no fim. A soma das porcentagens dá 100 (maiores
 * restos), para os números da tela fecharem (CA2).
 */
export function kindShares(games: readonly PlayedGame[], period: RadarPeriod): KindShare[] {
  const kinds: readonly GameKind[] = [...RADAR_AXES, 'outros'];
  const hours = kinds.map((kind) =>
    games.filter((g) => g.kind === kind).reduce((sum, g) => sum + hoursIn(g, period), 0),
  );
  const total = hours.reduce((sum, value) => sum + value, 0);
  const exact = hours.map((value) => (total > 0 ? (value / total) * 100 : 0));
  const percents = exact.map((value) => Math.floor(value));
  const missing = total > 0 ? 100 - percents.reduce((sum, value) => sum + value, 0) : 0;
  [...exact.keys()]
    .sort((a, b) => exact[b] - Math.floor(exact[b]) - (exact[a] - Math.floor(exact[a])))
    .slice(0, missing)
    .forEach((index) => {
      percents[index] += 1;
    });
  return kinds.map((kind, index) => ({
    kind,
    label: KIND_LABELS[kind],
    hours: hours[index],
    percent: percents[index],
  }));
}

/** "82%"; com horas, mas abaixo de 1%, "<1%" (CA2): "0%" pareceria que não jogou. */
export function percentLabel(share: KindShare): string {
  return share.hours > 0 && share.percent === 0 ? '<1%' : `${share.percent}%`;
}

/**
 * Título do jogador: o tipo com pelo menos 40% das horas; abaixo disso, "Jogador versátil". Sem horas,
 * sem título (CA5, CA18, CA19). "Outros" não dá título.
 */
export function playerTitle(shares: readonly KindShare[]): string | null {
  if (!shares.some((share) => share.hours > 0)) {
    return null;
  }
  const percentOf = (kind: GameKind) => shares.find((s) => s.kind === kind)?.percent ?? 0;
  const best = TITLES.reduce(
    (top, entry) => (percentOf(entry[0]) > percentOf(top[0]) ? entry : top),
    TITLES[0],
  );
  return percentOf(best[0]) >= TITLE_THRESHOLD ? best[1] : VERSATILE_TITLE;
}

/** Um eixo do radar, em coordenadas do desenho (o centro é `RADAR_CENTER`). */
export interface RadarAxis {
  kind: GameCategory;
  label: string;
  percent: number;
  /** Ponta do eixo. */
  x: number;
  y: number;
  /** Ponto da forma do jogador neste eixo. */
  px: number;
  py: number;
  /** Onde fica o rótulo. */
  lx: number;
  ly: number;
}

export const RADAR_CENTER = 280;
export const RADAR_RADIUS = 200;
const LABEL_RADIUS = 234;
/** Tamanho mínimo: tipo sem horas ainda aparece como um ponto perto do centro. */
const MIN_REACH = 0.05;

const round = (value: number) => Math.round(value * 10) / 10;

/**
 * Eixos do radar. O desenho usa a raiz quadrada da porcentagem: sem ela, quem joga quase só um tipo
 * vira uma linha e a forma some. Os números mostrados continuam sendo os reais (CA2).
 */
export function radarAxes(shares: readonly KindShare[]): RadarAxis[] {
  return RADAR_AXES.map((kind, index) => {
    const share = shares.find((s) => s.kind === kind);
    const percent = share?.percent ?? 0;
    const angle = (Math.PI * 2 * index) / RADAR_AXES.length - Math.PI / 2;
    const reach = RADAR_RADIUS * (MIN_REACH + (1 - MIN_REACH) * Math.sqrt(percent / 100));
    const at = (radius: number) => ({
      x: round(RADAR_CENTER + Math.cos(angle) * radius),
      y: round(RADAR_CENTER + Math.sin(angle) * radius),
    });
    const tip = at(RADAR_RADIUS);
    const point = at(reach);
    const label = at(LABEL_RADIUS);
    return {
      kind,
      label: KIND_LABELS[kind],
      percent,
      x: tip.x,
      y: tip.y,
      px: point.x,
      py: point.y,
      lx: label.x,
      ly: label.y,
    };
  });
}

/** Pontos da forma do jogador, no formato do `points` de um polígono SVG. */
export function radarPolygon(axes: readonly RadarAxis[]): string {
  return axes.map((axis) => `${axis.px},${axis.py}`).join(' ');
}

/** Descrição do radar para leitor de tela (CA23). */
export function radarDescription(shares: readonly KindShare[]): string {
  const parts = shares
    .filter((share) => share.hours > 0)
    .sort((a, b) => b.hours - a.hours)
    .map((share) => `${percentLabel(share)} ${share.label}`);
  return parts.length > 0
    ? `Radar do jogador: ${parts.join(', ')}.`
    : 'Radar do jogador sem horas.';
}

export interface GameBlock {
  /** Chave estável da lista; "outros" no bloco somado. */
  id: string;
  name: string;
  hours: number;
  /** Tipos dos jogos do bloco: um só, ou vários no bloco somado (CA4). */
  kinds: readonly GameKind[];
}

/** Jogos com bloco próprio (CA10). */
export const MAX_BLOCKS = 7;

/** Os 7 mais jogados do período e o resto somado em "Outros N jogos" (CA10). */
export function gameBlocks(games: readonly PlayedGame[], period: RadarPeriod): GameBlock[] {
  const played = gamesIn(games, period);
  const blocks: GameBlock[] = played.slice(0, MAX_BLOCKS).map((game) => ({
    id: String(game.appId),
    name: game.name,
    hours: hoursIn(game, period),
    kinds: [game.kind],
  }));
  const rest = played.slice(MAX_BLOCKS);
  if (rest.length > 0) {
    blocks.push({
      id: 'outros',
      name: rest.length === 1 ? 'Outro jogo' : `Outros ${rest.length} jogos`,
      hours: rest.reduce((sum, game) => sum + hoursIn(game, period), 0),
      kinds: [...new Set(rest.map((game) => game.kind))],
    });
  }
  return blocks;
}

/** Tipo do bloco em texto, para não depender da cor (CA23): "Tipo: Tiro", "Tipos: Tiro, Outros". */
export function blockKindsLabel(block: GameBlock): string {
  const labels = block.kinds.map((kind) => KIND_LABELS[kind]).join(', ');
  return `${block.kinds.length === 1 ? 'Tipo' : 'Tipos'}: ${labels}`;
}

/** Blocos em duas linhas: os 2 maiores em cima e o resto embaixo (CA10). */
export function blockRows(blocks: readonly GameBlock[]): GameBlock[][] {
  return [blocks.slice(0, 2), blocks.slice(2)].filter((row) => row.length > 0);
}

/** Horas do mês anterior (CA11). */
export function previousMonthHours(games: readonly PlayedGame[]): number {
  return games.reduce((sum, game) => sum + Math.max(0, game.previousMonthHours || 0), 0);
}

/** Nome do mês no fuso do card, com inicial maiúscula: `offset` -1 é o mês anterior (CA11). */
export function monthLabel(date: Date, offset = 0): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: 'numeric',
  }).formatToParts(date);
  const year = Number(parts.find((part) => part.type === 'year')?.value);
  const month = Number(parts.find((part) => part.type === 'month')?.value);
  // Dia 15 ao meio-dia UTC: longe da virada do mês em qualquer fuso.
  const name = new Intl.DateTimeFormat('pt-BR', { month: 'long', timeZone: 'UTC' }).format(
    new Date(Date.UTC(year, month - 1 + offset, 15, 12)),
  );
  return name.charAt(0).toUpperCase() + name.slice(1);
}

/** Jogo mais jogado desde sempre, para a imagem de compartilhar (CA14). */
export function topGame(games: readonly PlayedGame[]): PlayedGame | null {
  return gamesIn(games, 'all')[0] ?? null;
}

/** O que vai na imagem de compartilhar (CA14, CA15): só o @usuário e os dados de jogo. */
export interface RadarSummary {
  username: string;
  title: string | null;
  hours: number;
  games: number;
  top: PlayedGame | null;
  axes: RadarAxis[];
}

export function radarSummary(username: string, games: readonly PlayedGame[]): RadarSummary {
  const shares = kindShares(games, 'all');
  return {
    username,
    title: playerTitle(shares),
    hours: totalHours(games, 'all'),
    games: gameCount(games, 'all'),
    top: topGame(games),
    axes: radarAxes(shares),
  };
}
