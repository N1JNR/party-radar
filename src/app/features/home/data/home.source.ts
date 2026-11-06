import { InjectionToken } from '@angular/core';

import { PlayerCard } from '../domain/player-card';
import { PlayedGame } from '../domain/player-radar';
import { SeasonProgress, SeasonTrophy } from '../domain/season';

/** Tudo o que a home mostra (spec 002). */
export interface HomeData {
  card: PlayerCard;
  /** Jogos com tempo jogado, para o radar e os blocos (spec 004). */
  games: PlayedGame[];
  /** O mês anterior foi o da conexão com a Steam: as horas dele são estimativa (spec 004, CA11). */
  previousIsEstimate: boolean;
  /** A temporada em andamento; `null` sem Steam conectada (spec 005, CA16). */
  season: SeasonProgress | null;
  /** Temporadas terminadas, da mais recente para a mais antiga (spec 005, CA12). */
  trophies: SeasonTrophy[];
}

/**
 * De onde vêm os dados da home. Nesta entrega a implementação é simulada; a integração troca
 * só a implementação, sem mexer nas telas.
 */
export interface HomeDataSource {
  load(): Promise<HomeData>;
}

export const HOME_DATA_SOURCE = new InjectionToken<HomeDataSource>('HOME_DATA_SOURCE');
