/** Quanto a pessoa jogou desde que entrou no Party Radar. */
export interface PlayStats {
  /** Horas jogadas no total. */
  hours: number;
  /** Horas jogadas junto com amigos (parcerias confirmadas ou prováveis). */
  hoursWithFriends: number;
  /** Quantos amigos diferentes jogaram com a pessoa. */
  distinctFriends: number;
}

export type PatenteId = 'npc' | 'recruta' | 'soldado' | 'veterano' | 'lenda' | 'sem-vida-social';

export interface Patente {
  id: PatenteId;
  name: string;
  /** Regra em texto, mostrada na régua de patentes. */
  rule: string;
  minHours: number;
  minHoursWithFriends: number;
  minDistinctFriends: number;
}

/**
 * Patentes em ordem crescente (spec 002, "Conteúdo de referência"). As duas últimas exigem
 * jogar junto, para puxar o lado social do app. Valores a validar na spec de integração.
 */
export const PATENTES: readonly Patente[] = [
  {
    id: 'npc',
    name: 'NPC',
    rule: 'Acabou de chegar',
    minHours: 0,
    minHoursWithFriends: 0,
    minDistinctFriends: 0,
  },
  {
    id: 'recruta',
    name: 'Recruta da fila',
    rule: '1h jogada',
    minHours: 1,
    minHoursWithFriends: 0,
    minDistinctFriends: 0,
  },
  {
    id: 'soldado',
    name: 'Soldado do fim de semana',
    rule: '10h jogadas',
    minHours: 10,
    minHoursWithFriends: 0,
    minDistinctFriends: 0,
  },
  {
    id: 'veterano',
    name: 'Veterano de lobby',
    rule: '40h jogadas',
    minHours: 40,
    minHoursWithFriends: 0,
    minDistinctFriends: 0,
  },
  {
    id: 'lenda',
    name: 'Lenda do squad',
    rule: '80h, com 20h jogando com amigos',
    minHours: 80,
    minHoursWithFriends: 20,
    minDistinctFriends: 0,
  },
  {
    id: 'sem-vida-social',
    name: 'Sem vida social',
    rule: '200h, com 5 amigos diferentes',
    minHours: 200,
    minHoursWithFriends: 0,
    minDistinctFriends: 5,
  },
];

function meets(stats: PlayStats, patente: Patente): boolean {
  return (
    stats.hours >= patente.minHours &&
    stats.hoursWithFriends >= patente.minHoursWithFriends &&
    stats.distinctFriends >= patente.minDistinctFriends
  );
}

/** Valores negativos ou inválidos contam como zero. */
function sanitize(stats: PlayStats): PlayStats {
  const clean = (n: number) => (Number.isFinite(n) && n > 0 ? n : 0);
  return {
    hours: clean(stats.hours),
    hoursWithFriends: clean(stats.hoursWithFriends),
    distinctFriends: Math.floor(clean(stats.distinctFriends)),
  };
}

/** A patente mais alta cujos requisitos a pessoa já cumpre, em ordem (não pula degraus). */
export function patenteFor(stats: PlayStats): Patente {
  const clean = sanitize(stats);
  let current = PATENTES[0];
  for (const patente of PATENTES) {
    if (!meets(clean, patente)) {
      break;
    }
    current = patente;
  }
  return current;
}

export interface PatenteProgress {
  current: Patente;
  /** `null` na última patente. */
  next: Patente | null;
  /** Horas que faltam para a próxima (0 se as horas já bastam). */
  hoursRemaining: number;
  /** Horas com amigos que faltam para a próxima (0 se não exige ou já bastam). */
  friendHoursRemaining: number;
  /** Amigos diferentes que faltam para a próxima (0 se não exige ou já bastam). */
  friendsRemaining: number;
  /** Progresso em horas entre a patente atual e a próxima, de 0 a 100. */
  percent: number;
}

/** Onde a pessoa está e o que falta para subir (CA4 e CA7). */
export function progressFor(stats: PlayStats): PatenteProgress {
  const clean = sanitize(stats);
  const current = patenteFor(clean);
  const next = PATENTES[PATENTES.indexOf(current) + 1] ?? null;
  if (!next) {
    return {
      current,
      next,
      hoursRemaining: 0,
      friendHoursRemaining: 0,
      friendsRemaining: 0,
      percent: 100,
    };
  }
  const span = next.minHours - current.minHours;
  const done = clean.hours - current.minHours;
  return {
    current,
    next,
    hoursRemaining: Math.max(0, Math.ceil(next.minHours - clean.hours)),
    friendHoursRemaining: Math.max(0, Math.ceil(next.minHoursWithFriends - clean.hoursWithFriends)),
    friendsRemaining: Math.max(0, next.minDistinctFriends - clean.distinctFriends),
    percent: Math.min(100, Math.max(0, Math.floor((done / span) * 100))),
  };
}
