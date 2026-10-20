import { Injectable, computed, inject, signal } from '@angular/core';

import { STEAM_SOURCE, SteamAccountState, SteamRecheck } from '../../steam/data/steam.source';
import { progressFor } from '../domain/patentes';
import { isFirstAccess, platformShares } from '../domain/player-card';
import { playingCount, squadOpportunities } from '../domain/squad-opportunity';
import { SteamStepState } from '../domain/strengthen';
import { HOME_DATA_SOURCE, HomeData } from './home.source';

/** Um squad no menu do app, com quantos estão jogando agora. */
export interface MenuSquad {
  id: string;
  name: string;
  playing: number;
}

export type HomeStatus = 'loading' | 'error' | 'ready';

/**
 * Estado da home em signals (spec 002, CA8, CA11, CA14 e CA15). Fica na raiz porque o menu do
 * app também mostra os squads.
 */
@Injectable({ providedIn: 'root' })
export class HomeStore {
  private readonly source = inject(HOME_DATA_SOURCE);
  private readonly steamSource = inject(STEAM_SOURCE);
  private loadId = 0;

  readonly status = signal<HomeStatus>('loading');
  readonly data = signal<HomeData | null>(null);
  /** Conta Steam de quem está logado; `null` se não deu para ler (aí vale o que a home diz). */
  readonly steam = signal<SteamAccountState | null>(null);
  readonly answering = signal(false);
  readonly markingSteam = signal(false);

  /** Onde a Steam está, para o "Deixe seu card mais forte" e o aviso de perfil privado. */
  readonly steamStep = computed<SteamStepState>(() => {
    const steam = this.steam();
    if (!steam) {
      return this.data()?.steamPublic === false ? 'private' : 'public';
    }
    if (!steam.connected) {
      return 'not-connected';
    }
    return steam.visibility ?? 'reading';
  });
  /**
   * O checklist aparece no primeiro acesso, enquanto a Steam não foi conectada (CA1) e enquanto a
   * primeira leitura dela não terminou (CA2, CA19).
   */
  readonly showStrengthen = computed(() => {
    const step = this.steamStep();
    return this.firstAccess() || step === 'not-connected' || step === 'reading';
  });
  /** Aviso da Steam privada (spec 003, CA6). */
  readonly showSteamNotice = computed(() => this.steamStep() === 'private');

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
  /**
   * Squads do menu. `null` enquanto a home não carregou (ou deu erro), para o menu não afirmar
   * "Nenhum squad ainda" sem saber. Só muda quando os squads mudam, para não recriar o menu.
   */
  readonly menuSquads = computed<MenuSquad[] | null>(
    () => {
      const data = this.data();
      if (this.status() !== 'ready' || !data) {
        return null;
      }
      return data.squads.map((squad) => ({
        id: squad.id,
        name: squad.name,
        playing: playingCount(squad, data.friendsPlaying),
      }));
    },
    { equal: (a, b) => JSON.stringify(a) === JSON.stringify(b) },
  );

  /** Esquece os dados ao sair, para a próxima pessoa não ver os squads de quem saiu. */
  reset(): void {
    this.loadId++;
    this.data.set(null);
    this.steam.set(null);
    this.status.set('loading');
    this.answering.set(false);
    this.markingSteam.set(false);
  }

  /** Carrega (ou recarrega, no "Tentar de novo") os dados da home. Só vale a carga mais recente. */
  async load(): Promise<void> {
    const id = ++this.loadId;
    this.status.set('loading');
    try {
      // A conta Steam vem junto; se ela falhar, a home abre do mesmo jeito.
      const [data, steam] = await Promise.all([
        this.source.load(),
        this.steamSource.account().catch(() => null),
      ]);
      if (id === this.loadId) {
        this.data.set(data);
        this.steam.set(steam);
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
    const loadId = this.loadId;
    try {
      await this.source.answerPartnership(question.id, played);
      this.update(loadId, (data) => {
        const partner = data.card.partner;
        const confirmed =
          played && partner?.id === question.friendId ? { ...partner, probable: false } : partner;
        return { ...data, question: null, card: { ...data.card, partner: confirmed } };
      });
      return true;
    } catch {
      return false;
    } finally {
      this.answering.set(false);
    }
  }

  /**
   * "Já deixei público" (spec 003, CA7): lê a Steam de novo. Se ficou pública, o aviso some;
   * devolve o resultado para a tela avisar. `null` quando não há o que verificar.
   */
  async recheckSteam(): Promise<SteamRecheck | null> {
    if (!this.data() || this.markingSteam()) {
      return null;
    }
    this.markingSteam.set(true);
    const loadId = this.loadId;
    try {
      const result = await this.steamSource.recheck();
      if (result !== 'unavailable' && loadId === this.loadId) {
        this.steam.update((steam) =>
          steam ? { ...steam, visibility: result, lastSyncedAt: new Date().toISOString() } : steam,
        );
        this.update(loadId, (data) => ({ ...data, steamPublic: result === 'public' }));
      }
      return result;
    } catch {
      return 'unavailable';
    } finally {
      this.markingSteam.set(false);
    }
  }

  /** Aplica a resposta só se os dados ainda são os da carga em que a ação começou. */
  private update(loadId: number, change: (data: HomeData) => HomeData): void {
    if (loadId !== this.loadId) {
      return;
    }
    this.data.update((data) => (data ? change(data) : data));
  }
}
