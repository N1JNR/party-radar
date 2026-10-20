import { InjectionToken } from '@angular/core';

import { FriendPresence } from '../domain/friend-presence';
import { PartnershipQuestion } from '../domain/partnership';
import { PlayerCard } from '../domain/player-card';
import { Squad } from '../domain/squad-opportunity';

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
}

export const HOME_DATA_SOURCE = new InjectionToken<HomeDataSource>('HOME_DATA_SOURCE');
