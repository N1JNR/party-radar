import { patenteById } from './patentes';
import { formatHours } from './player-card';

/** A temporada em andamento de quem está logado (spec 005, CA1). */
export interface SeasonProgress {
  number: number;
  /** Dias depois de hoje; 0 no último dia. */
  daysLeft: number;
  /** Horas na temporada, já com o limite de 8 horas por dia. */
  hours: number;
  /** Jogo mais jogado na temporada. */
  topGame: string | null;
}

/** A patente final de uma temporada terminada (spec 005, CA10). */
export interface SeasonTrophy {
  season: number;
  /** Id da patente, gravado no fim da temporada. */
  rankId: string;
  hours: number;
  topGame: string | null;
}

/** "Temporada 1: faltam 52 dias.", "Temporada 1: falta 1 dia." ou "Temporada 1: último dia." */
export function seasonLabel(season: SeasonProgress): string {
  const days = Math.max(0, season.daysLeft);
  if (days === 0) {
    return `Temporada ${season.number}: último dia.`;
  }
  return days === 1
    ? `Temporada ${season.number}: falta 1 dia.`
    : `Temporada ${season.number}: faltam ${days} dias.`;
}

/** De onde vêm as horas da patente: da temporada, somando todos os jogos (CA4). */
export function seasonHoursLabel(hours: number): string {
  return hours > 0
    ? `${formatHours(hours)} nesta temporada, somando todos os seus jogos.`
    : 'Nenhuma hora nesta temporada ainda.';
}

/** Horas totais na Steam, que não zeram quando a temporada termina (CA14). */
export function careerLabel(hours: number): string {
  return `Carreira: ${formatHours(hours)} na Steam.`;
}

/** "Temporada 1: Veterano de lobby" (CA10). */
export function trophyLabel(trophy: SeasonTrophy): string {
  return `Temporada ${trophy.season}: ${patenteById(trophy.rankId).name}`;
}

/** "46h, mais em Elden Ring" ou só as horas, se o jogo não for conhecido (CA12). */
export function trophyDetail(trophy: SeasonTrophy): string {
  const hours = formatHours(trophy.hours);
  return trophy.topGame ? `${hours}, mais em ${trophy.topGame}` : hours;
}

/** Troféus da temporada mais recente para a mais antiga (CA12). */
export function sortTrophies(trophies: readonly SeasonTrophy[]): SeasonTrophy[] {
  return [...trophies].sort((a, b) => b.season - a.season);
}
