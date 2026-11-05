import { Injectable, computed, inject, signal } from '@angular/core';

import { Conversation, conversationsWithNews } from '../domain/chat';
import { CHAT_SOURCE } from './chat.source';

export type ChatStatus = 'idle' | 'loading' | 'error' | 'ready';

/** De quanto em quanto tempo relê, se o tempo real falhar sem avisar. */
export const CHAT_REFRESH_MS = 60_000;

/**
 * A lista de conversas e o tempo real (spec 007). Fica na raiz porque o menu diz quantas têm novidade
 * (CA18); `stop()` esquece tudo ao sair, para a próxima pessoa não ver nada de quem saiu.
 */
@Injectable({ providedIn: 'root' })
export class ChatStore {
  private readonly source = inject(CHAT_SOURCE);
  private readId = 0;
  private unsubscribe: (() => void) | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;

  readonly status = signal<ChatStatus>('idle');
  readonly conversations = signal<Conversation[]>([]);
  /** Sobe a cada novidade: a conversa aberta relê quando muda. */
  readonly version = signal(0);
  readonly withNews = computed(() => conversationsWithNews(this.conversations()));

  /** Liga o tempo real uma vez só, ao entrar no app. */
  start(): void {
    if (this.unsubscribe) {
      return;
    }
    this.unsubscribe = this.source.subscribe(() => this.changed());
    this.timer = setInterval(() => this.changed(), CHAT_REFRESH_MS);
    void this.load();
  }

  stop(): void {
    this.unsubscribe?.();
    this.unsubscribe = null;
    if (this.timer !== null) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.readId++;
    this.conversations.set([]);
    this.status.set('idle');
  }

  /** Carrega com o estado de carregando, para a primeira vez e o "Tentar de novo" (CA22). */
  async load(): Promise<void> {
    this.status.set('loading');
    await this.read(true);
  }

  /** Relê sem o carregando. Se falhar, fica o que estava. */
  refresh(): Promise<void> {
    return this.read(false);
  }

  /** A conversa com um amigo, já na lista; `null` se não forem amigos ou se falhar (CA1, CA2). */
  async openDirect(friendId: string): Promise<string | null> {
    const id = await this.source.openDirect(friendId).catch(() => null);
    if (id) {
      await this.refresh();
    }
    return id;
  }

  conversation(id: string | null): Conversation | null {
    return this.conversations().find((item) => item.id === id) ?? null;
  }

  private changed(): void {
    this.version.update((value) => value + 1);
    void this.refresh();
  }

  private async read(showError: boolean): Promise<void> {
    const id = ++this.readId;
    try {
      const list = await this.source.conversations();
      if (id === this.readId) {
        this.conversations.set(list);
        this.status.set('ready');
      }
    } catch {
      if (id === this.readId && showError) {
        this.status.set('error');
      }
    }
  }
}
