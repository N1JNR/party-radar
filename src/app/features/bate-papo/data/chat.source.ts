import { InjectionToken } from '@angular/core';

import {
  AddMemberStatus,
  ChatMessage,
  Conversation,
  CreateSquadStatus,
  SendStatus,
  SquadMember,
} from '../domain/chat';

/** Contrato entre as telas e o bate-papo. Real: funções e Realtime do Supabase. Simulado: em memória. */
export interface ChatSource {
  conversations(): Promise<Conversation[]>;
  /** Até 50 mensagens antes de `before`; sem `before`, as mais recentes (CA6). */
  messages(conversationId: string, before?: ChatMessage): Promise<ChatMessage[]>;
  /** Reenviar o mesmo `clientId` não duplica (CA9). */
  send(conversationId: string, clientId: string, body: string): Promise<SendStatus>;
  deleteMessage(messageId: string): Promise<boolean>;
  markRead(conversationId: string): Promise<void>;
  /** A conversa com um amigo; `null` se não forem amigos (CA2). */
  openDirect(friendId: string): Promise<string | null>;
  createSquad(
    name: string,
    memberIds: readonly string[],
  ): Promise<{ status: CreateSquadStatus; id: string | null }>;
  renameSquad(conversationId: string, name: string): Promise<boolean>;
  addMember(conversationId: string, userId: string): Promise<AddMemberStatus>;
  removeMember(conversationId: string, userId: string): Promise<boolean>;
  leaveSquad(conversationId: string): Promise<void>;
  squadMembers(conversationId: string): Promise<SquadMember[]>;
  /** Avisa que há novidade, inclusive ao reconectar (CA3, CA8). Devolve como parar de ouvir. */
  subscribe(listener: () => void): () => void;
}

export const CHAT_SOURCE = new InjectionToken<ChatSource>('CHAT_SOURCE');
