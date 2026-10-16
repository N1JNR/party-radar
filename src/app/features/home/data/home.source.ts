import { InjectionToken } from '@angular/core';

import { FriendPresence } from '../domain/friend-presence';
import { PlayerCard } from '../domain/player-card';
import { Squad } from '../domain/squad-opportunity';

/** Partida em que o app não tem certeza se a pessoa jogou junto com o amigo (CA11). */
export interface PartnershipQuestion {
  id: string;
  friendName: string;
  game: string;
  /** Início e fim da partida, em ISO 8601. */
  startedAt: string;
  endedAt: string;
}

/** Tudo o que a home mostra (spec 002). */
export interface HomeData {
  card: PlayerCard;
  /** Perfil da Steam público: sem ele, o card fica incompleto (CA8). */
  steamPublic: boolean;
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
  /** A pessoa avisou que deixou o perfil da Steam público. */
  markSteamPublic(): Promise<void>;
}

export const HOME_DATA_SOURCE = new InjectionToken<HomeDataSource>('HOME_DATA_SOURCE');
