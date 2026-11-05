import { DOCUMENT, Injectable, inject, signal } from '@angular/core';

import {
  ChatMessage,
  PAGE_SIZE,
  PendingMessage,
  SendStatus,
  mergeMessages,
  newClientId,
  sendFailureText,
  withoutDelivered,
} from '../domain/chat';
import { CHAT_SOURCE } from './chat.source';

export type ConversationStatus = 'idle' | 'loading' | 'error' | 'ready';

/** Uma conversa aberta (spec 007): as mensagens, as anteriores e o que ainda está sendo enviado. */
@Injectable()
export class ConversationStore {
  private readonly source = inject(CHAT_SOURCE);
  private readonly document = inject(DOCUMENT);
  private conversationId: string | null = null;
  private openId = 0;
  /** O que não saiu, por conversa: trocar de conversa não perde o texto (CA9). */
  private readonly notSent = new Map<string, PendingMessage[]>();

  readonly status = signal<ConversationStatus>('idle');
  readonly messages = signal<ChatMessage[]>([]);
  readonly pending = signal<PendingMessage[]>([]);
  readonly hasOlder = signal(false);
  readonly loadingOlder = signal(false);

  /** Abre uma conversa, esquecendo a anterior. */
  async open(conversationId: string): Promise<void> {
    const id = ++this.openId;
    this.putAwayNotSent();
    this.conversationId = conversationId;
    this.status.set('loading');
    this.messages.set([]);
    this.pending.set(this.notSent.get(conversationId) ?? []);
    this.hasOlder.set(false);
    try {
      const page = await this.source.messages(conversationId);
      if (id !== this.openId) {
        return;
      }
      this.absorb(page);
      this.hasOlder.set(page.length >= PAGE_SIZE);
      this.status.set('ready');
      await this.markRead();
    } catch {
      if (id === this.openId) {
        this.status.set('error');
      }
    }
  }

  close(): void {
    this.openId++;
    this.putAwayNotSent();
    this.conversationId = null;
    this.status.set('idle');
    this.messages.set([]);
    this.pending.set([]);
  }

  /** Relê as mais recentes e junta, sem repetir: serve para o tempo real e para reconectar (CA3, CA8). */
  async refresh(): Promise<void> {
    const conversationId = this.conversationId;
    if (!conversationId || this.status() !== 'ready') {
      return;
    }
    const id = this.openId;
    const page = await this.source.messages(conversationId).catch(() => null);
    if (page && id === this.openId) {
      if (this.leavesGap(page)) {
        // Ficaram mais de 50 mensagens para trás: recomeça das novas, e as outras vêm ao rolar (CA8).
        this.messages.set([]);
        this.hasOlder.set(true);
      }
      this.absorb(page);
      await this.markRead();
    }
  }

  /** Carrega as anteriores, ao rolar para cima (CA6). */
  async loadOlder(): Promise<void> {
    const conversationId = this.conversationId;
    const oldest = this.messages().at(0);
    if (!conversationId || !oldest || this.loadingOlder() || !this.hasOlder()) {
      return;
    }
    const id = this.openId;
    this.loadingOlder.set(true);
    try {
      const page = await this.source.messages(conversationId, oldest);
      if (id === this.openId) {
        this.messages.update((current) => mergeMessages(current, page));
        this.hasOlder.set(page.length >= PAGE_SIZE);
      }
    } catch {
      // O botão continua lá, para tentar de novo.
    } finally {
      this.loadingOlder.set(false);
    }
  }

  /** A mensagem aparece na hora, com "Enviando…" (CA9). */
  send(body: string): Promise<void> {
    const item: PendingMessage = {
      clientId: newClientId(),
      body,
      status: 'sending',
      reason: null,
    };
    this.pending.update((current) => [...current, item]);
    return this.deliver(item);
  }

  /** Tentar de novo usa o mesmo `clientId`, então não duplica (CA9). */
  retry(clientId: string): Promise<void> {
    const item = this.pending().find((other) => other.clientId === clientId);
    return item ? this.deliver(item) : Promise.resolve();
  }

  /** Devolve `false` se não deu para apagar (CA5). */
  async deleteMessage(messageId: string): Promise<boolean> {
    try {
      if (!(await this.source.deleteMessage(messageId))) {
        return false;
      }
      // A releitura só traz as 50 mais novas, e esta pode ser mais antiga (CA5).
      this.messages.update((current) =>
        current.map((item) =>
          item.id === messageId ? { ...item, body: null, deleted: true } : item,
        ),
      );
      await this.refresh();
      return true;
    } catch {
      return false;
    }
  }

  private async deliver(item: PendingMessage): Promise<void> {
    const conversationId = this.conversationId;
    if (!conversationId) {
      return;
    }
    const id = this.openId;
    this.setPending(item.clientId, 'sending', null);
    let status: SendStatus | 'failed';
    try {
      status = await this.source.send(conversationId, item.clientId, item.body);
    } catch {
      status = 'failed';
    }
    if (id !== this.openId) {
      return;
    }
    if (status === 'sent') {
      await this.refresh();
    } else {
      this.setPending(item.clientId, 'failed', sendFailureText(status));
    }
  }

  private absorb(page: readonly ChatMessage[]): void {
    this.messages.update((current) => mergeMessages(current, page));
    this.pending.update((current) => withoutDelivered(current, this.messages()));
  }

  private setPending(
    clientId: string,
    status: PendingMessage['status'],
    reason: string | null,
  ): void {
    this.pending.update((current) =>
      current.map((item) => (item.clientId === clientId ? { ...item, status, reason } : item)),
    );
  }

  /** A página cheia não encosta no que já está na tela? */
  private leavesGap(page: readonly ChatMessage[]): boolean {
    const shown = new Set(this.messages().map((item) => item.id));
    return shown.size > 0 && page.length >= PAGE_SIZE && !page.some((item) => shown.has(item.id));
  }

  /** O que estava saindo ao trocar de conversa volta como falha, e some se tiver chegado (CA9). */
  private putAwayNotSent(): void {
    if (this.conversationId) {
      this.notSent.set(
        this.conversationId,
        this.pending().map((item) =>
          item.status === 'sending'
            ? { ...item, status: 'failed', reason: sendFailureText('failed') }
            : item,
        ),
      );
    }
  }

  /** Com a aba escondida, ninguém leu: a novidade continua no menu (CA18). */
  private async markRead(): Promise<void> {
    if (this.conversationId && !this.document.hidden) {
      await this.source.markRead(this.conversationId).catch(() => undefined);
    }
  }
}
