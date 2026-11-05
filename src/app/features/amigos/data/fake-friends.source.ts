import { DOCUMENT, Injectable, inject } from '@angular/core';

import { FoundPlayer, Friend, FriendsData, Player, SendResult } from '../domain/friends';
import { FriendsSource } from './friends.source';

const player = (id: string, name: string): Player => ({
  id,
  name,
  username: id,
  avatarUrl: null,
});

const friend = (id: string, name: string, playing: string | null): Friend => ({
  ...player(id, name),
  playing,
});

/** Pessoas que existem no app simulado, para testar a busca e o convite. */
const OTHERS = [player('rafa_jogos', 'Rafa'), player('lia_gamer', 'Lia')];

/**
 * Amigos simulados, em memória, para revisar a tela sem banco (`?simular=`). `?simular=primeiro-acesso`
 * começa sem ninguém, e `?simular=erro` falha na primeira carga.
 */
@Injectable()
export class FakeFriendsSource implements FriendsSource {
  private readonly document = inject(DOCUMENT);
  private readonly scenario =
    new URLSearchParams(this.document.defaultView?.location.search ?? '').get('simular') ?? '';
  private failedOnce = false;
  private data: FriendsData =
    this.scenario === 'primeiro-acesso'
      ? { friends: [], received: [], sent: [], blocked: [] }
      : {
          friends: [
            friend('caio_fps', 'Caio', null),
            friend('bia_souls', 'Bia', 'Elden Ring'),
            friend('duda_gg', 'Duda', null),
          ],
          received: [player('gui_lobby', 'Gui')],
          sent: [player('nina_play', 'Nina')],
          blocked: [],
        };

  load(): Promise<FriendsData> {
    if (this.scenario === 'erro' && !this.failedOnce) {
      this.failedOnce = true;
      return Promise.reject(new Error('Falha simulada ao carregar os amigos.'));
    }
    return Promise.resolve(this.copy());
  }

  find(username: string): Promise<FoundPlayer | null> {
    return Promise.resolve(this.lookup(username));
  }

  private lookup(username: string): FoundPlayer | null {
    const { friends, received, sent, blocked } = this.data;
    const groups = [
      { list: friends, relation: 'friend' },
      { list: received, relation: 'received' },
      { list: sent, relation: 'sent' },
      { list: blocked, relation: 'blocked' },
      { list: OTHERS, relation: 'none' },
    ] as const;
    for (const { list, relation } of groups) {
      const found = list.find((person) => person.username === username);
      if (found) {
        const { id, name, avatarUrl } = found;
        return { id, name, username, avatarUrl, relation };
      }
    }
    return null;
  }

  send(userId: string): Promise<SendResult> {
    const person = OTHERS.find((other) => other.id === userId);
    const asked = this.data.received.find((other) => other.id === userId);
    if (asked) {
      this.becomeFriends(asked);
      return Promise.resolve('friends');
    }
    if (!person) {
      return Promise.resolve('not_found');
    }
    if (this.data.sent.some((other) => other.id === userId)) {
      return Promise.resolve('already_sent');
    }
    this.data.sent = [...this.data.sent, person];
    return Promise.resolve('sent');
  }

  answer(userId: string, accept: boolean): Promise<boolean> {
    const person = this.data.received.find((other) => other.id === userId);
    if (!person) {
      return Promise.resolve(false);
    }
    if (accept) {
      this.becomeFriends(person);
    } else {
      this.data.received = this.data.received.filter((other) => other.id !== userId);
    }
    return Promise.resolve(true);
  }

  cancel(userId: string): Promise<void> {
    this.data.sent = this.data.sent.filter((other) => other.id !== userId);
    return Promise.resolve();
  }

  remove(userId: string): Promise<void> {
    this.data.friends = this.data.friends.filter((other) => other.id !== userId);
    return Promise.resolve();
  }

  block(userId: string): Promise<void> {
    const { friends, received, sent } = this.data;
    const person = [...friends, ...received, ...sent].find((other) => other.id === userId);
    this.data = {
      friends: friends.filter((other) => other.id !== userId),
      received: received.filter((other) => other.id !== userId),
      sent: sent.filter((other) => other.id !== userId),
      blocked: person
        ? [
            ...this.data.blocked,
            {
              id: person.id,
              name: person.name,
              username: person.username,
              avatarUrl: person.avatarUrl,
            },
          ]
        : this.data.blocked,
    };
    return Promise.resolve();
  }

  unblock(userId: string): Promise<void> {
    this.data.blocked = this.data.blocked.filter((other) => other.id !== userId);
    return Promise.resolve();
  }

  private becomeFriends(person: Player): void {
    this.data.received = this.data.received.filter((other) => other.id !== person.id);
    this.data.friends = [...this.data.friends, { ...person, playing: null }];
  }

  private copy(): FriendsData {
    const { friends, received, sent, blocked } = this.data;
    return {
      friends: [...friends],
      received: [...received],
      sent: [...sent],
      blocked: [...blocked],
    };
  }
}
