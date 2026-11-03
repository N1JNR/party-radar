export type PatenteId = 'npc' | 'recruta' | 'soldado' | 'veterano' | 'lenda' | 'sem-vida-social';

export interface Patente {
  id: PatenteId;
  name: string;
  /** Meta em texto, mostrada na trilha. */
  goal: string;
  /** Ritmo para chegar lá numa temporada; `null` em quem acabou de chegar. */
  pace: string | null;
  /** Horas na temporada. */
  minHours: number;
}

/**
 * Patentes em ordem crescente (spec 005). A mesma tabela está em `season_rank()`, no banco, que grava
 * a patente dos troféus: os testes dos dois lados conferem as metas da spec.
 */
export const PATENTES: readonly Patente[] = [
  { id: 'npc', name: 'NPC', goal: 'Início da temporada', pace: null, minHours: 0 },
  {
    id: 'recruta',
    name: 'Recruta da fila',
    goal: '5h',
    pace: 'cerca de 35 min por semana',
    minHours: 5,
  },
  {
    id: 'soldado',
    name: 'Soldado do fim de semana',
    goal: '15h',
    pace: 'cerca de 2h por semana',
    minHours: 15,
  },
  {
    id: 'veterano',
    name: 'Veterano de lobby',
    goal: '40h',
    pace: 'cerca de 5h por semana',
    minHours: 40,
  },
  { id: 'lenda', name: 'Lenda do squad', goal: '120h', pace: 'cerca de 2h por dia', minHours: 120 },
  {
    id: 'sem-vida-social',
    name: 'Sem vida social',
    goal: '200h',
    pace: 'cerca de 3h20 por dia',
    minHours: 200,
  },
];

/** Valores negativos ou inválidos contam como zero. */
const clean = (hours: number) => (Number.isFinite(hours) && hours > 0 ? hours : 0);

/** A patente mais alta que as horas alcançam. */
export function patenteFor(hours: number): Patente {
  const valid = clean(hours);
  return PATENTES.reduce((current, patente) => (valid >= patente.minHours ? patente : current));
}

/** A patente de um troféu, pelo id gravado; id desconhecido vira NPC, sem quebrar a tela. */
export function patenteById(id: string): Patente {
  return PATENTES.find((patente) => patente.id === id) ?? PATENTES[0];
}

export interface PatenteProgress {
  current: Patente;
  /** `null` na última patente. */
  next: Patente | null;
  /** Horas que faltam para a próxima. */
  hoursRemaining: number;
  /** Progresso em horas entre a patente atual e a próxima, de 0 a 100. */
  percent: number;
}

/** Onde a pessoa está e o que falta para subir (spec 005, CA4). */
export function progressFor(hours: number): PatenteProgress {
  const valid = clean(hours);
  const current = patenteFor(valid);
  const next = PATENTES[PATENTES.indexOf(current) + 1] ?? null;
  if (!next) {
    return { current, next, hoursRemaining: 0, percent: 100 };
  }
  const span = next.minHours - current.minHours;
  return {
    current,
    next,
    hoursRemaining: Math.ceil(next.minHours - valid),
    percent: Math.floor(((valid - current.minHours) / span) * 100),
  };
}

/**
 * O que falta para a próxima patente, em texto: "Falta 1h para Recruta da fila." ou
 * "Faltam 78h para Lenda do squad." Vazio na última patente.
 */
export function remainingLabel(progress: PatenteProgress): string {
  if (!progress.next) {
    return '';
  }
  const verb = progress.hoursRemaining === 1 ? 'Falta' : 'Faltam';
  return `${verb} ${progress.hoursRemaining}h para ${progress.next.name}.`;
}
