import { Injectable, computed, inject, signal } from '@angular/core';

import {
  FoundPlayer,
  FriendsData,
  SendResult,
  cleanUsername,
  isUsername,
  sortFriends,
} from '../domain/friends';
import { FRIENDS_SOURCE } from './friends.source';

export type FriendsStatus = 'loading' | 'error' | 'ready';

/** Busca pelo @usuário: nada ainda, procurando, não achou, achou ou falhou. */
export type Lookup =
  | { status: 'idle' }
  | { status: 'searching' }
  | { status: 'not-found' }
  | { status: 'error' }
  | { status: 'found'; player: FoundPlayer };

/**
 * Estado de uma tela de amigos (spec 006). Fica na própria tela, e não na raiz, para a próxima pessoa
 * nunca ver os amigos de quem saiu.
 */
@Injectable()
export class FriendsStore {
  private readonly source = inject(FRIENDS_SOURCE);
  private lookupId = 0;
  private readId = 0;

  readonly status = signal<FriendsStatus>('loading');
  readonly data = signal<FriendsData | null>(null);
  readonly lookup = signal<Lookup>({ status: 'idle' });
  /** Uma ação em andamento: os botões ficam parados, para não enviar duas vezes. */
  readonly busy = signal(false);
  readonly friends = computed(() => sortFriends(this.data()?.friends ?? []));

  async load(): Promise<void> {
    const id = ++this.readId;
    this.status.set('loading');
    try {
      const data = await this.source.load();
      if (id === this.readId) {
        this.data.set(data);
        this.status.set('ready');
      }
    } catch {
      if (id === this.readId) {
        this.status.set('error');
      }
    }
  }

  /** Relê sem o esqueleto de carregando (CA13). Se falhar, fica o que estava. */
  async refresh(): Promise<void> {
    if (this.status() !== 'ready') {
      return;
    }
    // Só vale a leitura mais recente: uma antiga traria de volta a lista de antes de uma ação.
    const id = ++this.readId;
    const data = await this.source.load().catch(() => null);
    if (data && id === this.readId) {
      this.data.set(data);
    }
  }

  /** Procura pelo @usuário exato; só a busca mais recente vale (CA3, CA4). */
  async find(text: string): Promise<void> {
    const id = ++this.lookupId;
    const username = cleanUsername(text);
    if (!isUsername(username)) {
      this.lookup.set({ status: 'not-found' });
      return;
    }
    this.lookup.set({ status: 'searching' });
    try {
      const player = await this.source.find(username);
      if (id === this.lookupId) {
        this.lookup.set(player ? { status: 'found', player } : { status: 'not-found' });
      }
    } catch {
      if (id === this.lookupId) {
        this.lookup.set({ status: 'error' });
      }
    }
  }

  clearLookup(): void {
    this.lookupId++;
    this.lookup.set({ status: 'idle' });
  }

  /** Pede amizade e atualiza a lista e a busca. `null` se falhou (CA19). */
  async send(player: FoundPlayer): Promise<SendResult | null> {
    let result: SendResult | null = null;
    await this.run(async () => {
      result = await this.source.send(player.id);
    });
    if (result !== null) {
      await this.find(player.username);
    }
    return result;
  }

  /** `gone`: a outra pessoa cancelou antes da resposta, e nada mudou (CA8, CA10). */
  async answer(userId: string, accept: boolean): Promise<'done' | 'gone' | 'failed'> {
    let open = false;
    const ran = await this.run(async () => {
      open = await this.source.answer(userId, accept);
    });
    if (!ran) {
      return 'failed';
    }
    return open ? 'done' : 'gone';
  }

  cancel(userId: string): Promise<boolean> {
    return this.run(() => this.source.cancel(userId));
  }

  remove(userId: string): Promise<boolean> {
    return this.run(() => this.source.remove(userId));
  }

  block(userId: string): Promise<boolean> {
    return this.run(() => this.source.block(userId));
  }

  unblock(userId: string): Promise<boolean> {
    return this.run(() => this.source.unblock(userId));
  }

  /**
   * Faz a ação, relê a lista e limpa a busca, que ficaria mostrando a relação antiga. Devolve `false`
   * se falhou, e a lista não muda (CA19).
   */
  private async run(action: () => Promise<void>): Promise<boolean> {
    this.busy.set(true);
    try {
      await action();
      this.clearLookup();
      await this.refresh();
      return true;
    } catch {
      return false;
    } finally {
      this.busy.set(false);
    }
  }
}
