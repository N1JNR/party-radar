import { Injectable, computed, inject, signal } from '@angular/core';

import { progressFor } from '../domain/patentes';
import { isFirstAccess, platformShares } from '../domain/player-card';
import { playingCount, squadOpportunities } from '../domain/squad-opportunity';
import { HOME_DATA_SOURCE, HomeData } from './home.source';

export type HomeStatus = 'loading' | 'error' | 'ready';

/**
 * Estado da home em signals (spec 002, CA8, CA11, CA14 e CA15). Fica na raiz porque o menu do
 * app também mostra os squads.
 */
@Injectable({ providedIn: 'root' })
export class HomeStore {
  private readonly source = inject(HOME_DATA_SOURCE);
  private loadId = 0;

  readonly status = signal<HomeStatus>('loading');
  readonly data = signal<HomeData | null>(null);
  readonly answering = signal(false);
  readonly markingSteam = signal(false);

  readonly card = computed(() => this.data()?.card ?? null);
  readonly firstAccess = computed(() => {
    const card = this.card();
    return card ? isFirstAccess(card) : false;
  });
  readonly progress = computed(() => {
    const card = this.card();
    return card ? progressFor(card.stats) : null;
  });
  readonly platforms = computed(() => platformShares(this.card()?.platforms ?? []));
  readonly opportunities = computed(() => {
    const data = this.data();
    return data ? squadOpportunities(data.squads, data.friendsPlaying) : [];
  });
  readonly menuSquads = computed(() => {
    const data = this.data();
    if (!data) {
      return [];
    }
    return data.squads.map((squad) => ({
      id: squad.id,
      name: squad.name,
      playing: playingCount(squad, data.friendsPlaying),
    }));
  });

  /** Carrega (ou recarrega, no "Tentar de novo") os dados da home. Só vale a carga mais recente. */
  async load(): Promise<void> {
    const id = ++this.loadId;
    this.status.set('loading');
    try {
      const data = await this.source.load();
      if (id === this.loadId) {
        this.data.set(data);
        this.status.set('ready');
      }
    } catch {
      if (id === this.loadId) {
        this.status.set('error');
      }
    }
  }

  /**
   * Responde a pergunta de parceria (CA11): a pergunta some e, se jogou, a parceria deixa de ser
   * "provável". Devolve `false` se a resposta não foi salva; a pergunta continua na tela.
   */
  async answerPartnership(played: boolean): Promise<boolean> {
    const question = this.data()?.question;
    if (!question || this.answering()) {
      return false;
    }
    this.answering.set(true);
    try {
      await this.source.answerPartnership(question.id, played);
      this.update((data) => {
        const partner = data.card.partner;
        const confirmed =
          played && partner?.name === question.friendName
            ? { ...partner, probable: false }
            : partner;
        return { ...data, question: null, card: { ...data.card, partner: confirmed } };
      });
      return true;
    } catch {
      return false;
    } finally {
      this.answering.set(false);
    }
  }

  /** "Já deixei público" (CA8): o aviso some. Devolve `false` se não foi salvo. */
  async markSteamPublic(): Promise<boolean> {
    if (!this.data() || this.markingSteam()) {
      return false;
    }
    this.markingSteam.set(true);
    try {
      await this.source.markSteamPublic();
      this.update((data) => ({ ...data, steamPublic: true }));
      return true;
    } catch {
      return false;
    } finally {
      this.markingSteam.set(false);
    }
  }

  private update(change: (data: HomeData) => HomeData): void {
    this.data.update((data) => (data ? change(data) : data));
  }
}
