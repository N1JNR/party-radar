import { InjectionToken } from '@angular/core';

import { FriendPresence } from '../domain/friend-presence';
import { PartnershipQuestion } from '../domain/partnership';
import { PlayerCard } from '../domain/player-card';
import { PlayedGame } from '../domain/player-radar';
import { SeasonProgress, SeasonTrophy } from '../domain/season';
import { Squad } from '../domain/squad-opportunity';

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
  /** Amigos adicionados no Party Radar. */
  friendsCount: number;
  friendsPlaying: FriendPresence[];
  squads: Squad[];
  question: PartnershipQuestion | null;
  inviteLink: string;
}

/**
 * De onde vêm os dados da home. Nesta entrega a implementação é simulada; a integração troca
 * só a implementação, sem mexer nas telas.
 */
export interface HomeDataSource {
  load(): Promise<HomeData>;
  /** Resposta da pergunta de parceria: jogou ou não jogou junto. */
  answerPartnership(questionId: string, played: boolean): Promise<void>;
}

export const HOME_DATA_SOURCE = new InjectionToken<HomeDataSource>('HOME_DATA_SOURCE');
