import { InjectionToken } from '@angular/core';

import { FoundPlayer, FriendsData, SendResult } from '../domain/friends';

/** Contrato entre as telas e os amigos. Real: funções do Supabase. Simulado: em memória. */
export interface FriendsSource {
  load(): Promise<FriendsData>;
  /** Pessoa pelo @usuário exato; `null` se não existe ou se ela me bloqueou (CA4). */
  find(username: string): Promise<FoundPlayer | null>;
  send(userId: string): Promise<SendResult>;
  /** Devolve `false` se o pedido não estava mais aberto. */
  answer(userId: string, accept: boolean): Promise<boolean>;
  cancel(userId: string): Promise<void>;
  remove(userId: string): Promise<void>;
  block(userId: string): Promise<void>;
  unblock(userId: string): Promise<void>;
}

export const FRIENDS_SOURCE = new InjectionToken<FriendsSource>('FRIENDS_SOURCE');
