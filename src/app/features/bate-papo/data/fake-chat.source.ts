import { DOCUMENT, Injectable, inject } from '@angular/core';

import {
  AddMemberStatus,
  ChatMessage,
  Conversation,
  CreateSquadStatus,
  SendStatus,
  SquadMember,
} from '../domain/chat';
import { ChatSource } from './chat.source';

const ME = 'simulado';

const message = (
  id: string,
  senderId: string,
  senderName: string,
  body: string,
  minutesAgo: number,
): ChatMessage => ({
  id,
  clientId: id,
  senderId,
  senderName,
  senderAvatarUrl: null,
  body,
  createdAt: new Date(Date.now() - minutesAgo * 60_000).toISOString(),
  deleted: false,
  mine: senderId === ME,
});

interface FakeConversation {
  info: Conversation;
  members: SquadMember[];
  messages: ChatMessage[];
}

const member = (id: string, name: string, isOwner = false): SquadMember => ({
  id,
  name,
  username: id,
  avatarUrl: null,
  isOwner,
});

const conversation = (
  id: string,
  kind: Conversation['kind'],
  title: string,
  isOwner: boolean,
  unread: number,
): Conversation => ({
  id,
  kind,
  title,
  avatarUrl: null,
  isOwner,
  memberCount: 2,
  canSend: true,
  lastBody: null,
  lastDeleted: false,
  lastSenderName: null,
  lastAt: null,
  unread,
});

/**
 * Bate-papo simulado, em memória, para revisar a tela sem banco (`?simular=`). `?simular=primeiro-acesso`
 * começa sem conversas, e `?simular=erro` falha na primeira carga.
 */
@Injectable()
export class FakeChatSource implements ChatSource {
  private readonly document = inject(DOCUMENT);
  private readonly scenario =
    new URLSearchParams(this.document.defaultView?.location.search ?? '').get('simular') ?? '';
  private failedOnce = false;
  private nextId = 1;
  private readonly listeners = new Set<() => void>();
  private store: FakeConversation[] =
    this.scenario === 'primeiro-acesso'
      ? []
      : [
          {
            info: conversation('squad-sexta', 'squad', 'Squad da Sexta', true, 2),
            members: [
              member(ME, 'Você', true),
              member('bia_souls', 'Bia'),
              member('caio_fps', 'Caio'),
            ],
            messages: [
              message('m1', 'caio_fps', 'Caio', 'Quem joga hoje?', 300),
              message('m2', ME, 'Você', 'Eu topo depois das 21h.', 200),
              message('m3', 'bia_souls', 'Bia', 'Fechou! Abro o lobby.', 5),
            ],
          },
          {
            info: conversation('direct-bia', 'direct', 'Bia', false, 0),
            members: [],
            messages: [message('m4', 'bia_souls', 'Bia', 'Viu a temporada nova?', 1500)],
          },
        ];

  conversations(): Promise<Conversation[]> {
    if (this.scenario === 'erro' && !this.failedOnce) {
      this.failedOnce = true;
      return Promise.reject(new Error('Falha simulada ao carregar as conversas.'));
    }
    const list = this.store.map(({ info, members, messages }) => {
      const last = messages.at(-1);
      return {
        ...info,
        memberCount: members.length || 2,
        lastBody: last?.body ?? null,
        lastDeleted: last?.deleted ?? false,
        lastSenderName: last?.senderName ?? null,
        lastAt: last?.createdAt ?? null,
      };
    });
    return Promise.resolve(list.sort((a, b) => (b.lastAt ?? '').localeCompare(a.lastAt ?? '')));
  }

  messages(conversationId: string, before?: ChatMessage): Promise<ChatMessage[]> {
    const all = this.find(conversationId)?.messages ?? [];
    return Promise.resolve(
      before ? all.filter((item) => item.createdAt < before.createdAt) : [...all],
    );
  }

  send(conversationId: string, clientId: string, body: string): Promise<SendStatus> {
    const found = this.find(conversationId);
    if (!found) {
      return Promise.resolve('not_member');
    }
    if (!found.messages.some((item) => item.clientId === clientId)) {
      found.messages.push({
        ...message(`novo-${this.nextId++}`, ME, 'Você', body.trim(), 0),
        clientId,
      });
    }
    this.notify();
    return Promise.resolve('sent');
  }

  deleteMessage(messageId: string): Promise<boolean> {
    for (const { messages } of this.store) {
      const index = messages.findIndex((item) => item.id === messageId && item.senderId === ME);
      if (index >= 0) {
        messages[index] = { ...messages[index], body: null, deleted: true };
        this.notify();
        return Promise.resolve(true);
      }
    }
    return Promise.resolve(false);
  }

  markRead(conversationId: string): Promise<void> {
    const found = this.find(conversationId);
    if (found) {
      found.info = { ...found.info, unread: 0 };
    }
    return Promise.resolve();
  }

  openDirect(friendId: string): Promise<string | null> {
    const id = `direct-${friendId}`;
    if (!this.find(id)) {
      this.store.push({
        info: conversation(id, 'direct', friendId, false, 0),
        members: [],
        messages: [],
      });
    }
    return Promise.resolve(id);
  }

  createSquad(
    name: string,
    memberIds: readonly string[],
  ): Promise<{ status: CreateSquadStatus; id: string | null }> {
    if (memberIds.length === 0) {
      return Promise.resolve({ status: 'no_members', id: null });
    }
    const id = `squad-${this.nextId++}`;
    this.store.push({
      info: conversation(id, 'squad', name.trim(), true, 0),
      members: [member(ME, 'Você', true), ...memberIds.map((other) => member(other, other))],
      messages: [],
    });
    return Promise.resolve({ status: 'created', id });
  }

  renameSquad(conversationId: string, name: string): Promise<boolean> {
    const found = this.find(conversationId);
    if (!found?.info.isOwner) {
      return Promise.resolve(false);
    }
    found.info = { ...found.info, title: name.trim() };
    return Promise.resolve(true);
  }

  addMember(conversationId: string, userId: string): Promise<AddMemberStatus> {
    const found = this.find(conversationId);
    if (!found?.info.isOwner) {
      return Promise.resolve('not_owner');
    }
    if (found.members.some((item) => item.id === userId)) {
      return Promise.resolve('already');
    }
    found.members.push(member(userId, userId));
    return Promise.resolve('added');
  }

  removeMember(conversationId: string, userId: string): Promise<boolean> {
    const found = this.find(conversationId);
    if (!found?.info.isOwner) {
      return Promise.resolve(false);
    }
    found.members = found.members.filter((item) => item.id !== userId);
    return Promise.resolve(true);
  }

  leaveSquad(conversationId: string): Promise<void> {
    this.store = this.store.filter((item) => item.info.id !== conversationId);
    return Promise.resolve();
  }

  squadMembers(conversationId: string): Promise<SquadMember[]> {
    return Promise.resolve([...(this.find(conversationId)?.members ?? [])]);
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private find(conversationId: string): FakeConversation | undefined {
    return this.store.find((item) => item.info.id === conversationId);
  }

  private notify(): void {
    this.listeners.forEach((listener) => listener());
  }
}
