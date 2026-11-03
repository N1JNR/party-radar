import { patenteById, patenteFor } from './patentes';
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

/** O que vai na imagem da temporada ou do troféu (CA13): só o @usuário e os dados de jogo. */
export interface SeasonImage {
  username: string;
  season: number;
  rankId: string;
  hours: number;
  topGame: string | null;
  /** `null` em temporada terminada. */
  daysLeft: number | null;
}

/** Imagem da temporada em andamento. */
export function seasonImage(username: string, season: SeasonProgress): SeasonImage {
  return {
    username,
    season: season.number,
    rankId: patenteFor(season.hours).id,
    hours: season.hours,
    topGame: season.topGame,
    daysLeft: Math.max(0, season.daysLeft),
  };
}

/** Imagem de um troféu: a patente é a gravada, mesmo que as metas mudem depois. */
export function trophyImage(username: string, trophy: SeasonTrophy): SeasonImage {
  return {
    username,
    season: trophy.season,
    rankId: trophy.rankId,
    hours: trophy.hours,
    topGame: trophy.topGame,
    daysLeft: null,
  };
}

/** "Faltam 52 dias", "Falta 1 dia", "Último dia" ou "Temporada encerrada". */
export function seasonImageStatus(image: SeasonImage): string {
  if (image.daysLeft === null) {
    return 'Temporada encerrada';
  }
  if (image.daysLeft === 0) {
    return 'Último dia';
  }
  return image.daysLeft === 1 ? 'Falta 1 dia' : `Faltam ${image.daysLeft} dias`;
}

/** Troféus da temporada mais recente para a mais antiga (CA12). */
export function sortTrophies(trophies: readonly SeasonTrophy[]): SeasonTrophy[] {
  return [...trophies].sort((a, b) => b.season - a.season);
}
