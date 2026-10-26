import { Injectable, inject } from '@angular/core';

import { AuthStore } from '../../../core/auth/auth.store';
import { ExternalNavigation } from '../../../core/platform/external-navigation';
import { SUPABASE } from '../../../core/supabase/supabase.client';
import { PlayerCard } from '../domain/player-card';
import { HomeData, HomeDataSource } from './home.source';

/**
 * Uma linha de `my_card_stats()`. Escrita à mão de propósito: o `database.types.ts` gerado diz que
 * as colunas de funções SQL nunca vêm nulas, mas nome, visibilidade, jogo e jogo do mês vêm.
 */
interface CardStatsRow {
  steam_name: string | null;
  visibility: string | null;
  current_game: string | null;
  last_synced_at: string | null;
  month_minutes: number;
  month_games: number;
  game_of_month: string | null;
  game_of_month_minutes: number | null;
  total_minutes: number;
  estimate: boolean;
}

const toHours = (minutes: number | null | undefined) =>
  typeof minutes === 'number' && minutes > 0 ? minutes / 60 : 0;

/**
 * Home de verdade (spec 003, Parte 3b): nome e foto do Discord (perfil) e os números da Steam,
 * calculados no banco por `my_card_stats()`. Amigos, squads e a pergunta de parceria ficam vazios
 * até a spec de amigos (CA13); o título do mês fica escondido.
 */
@Injectable()
export class SupabaseHomeSource implements HomeDataSource {
  private readonly supabase = inject(SUPABASE);
  private readonly auth = inject(AuthStore);
  private readonly navigation = inject(ExternalNavigation);

  async load(): Promise<HomeData> {
    const { data, error } = await this.supabase.rpc('my_card_stats');
    if (error) {
      throw error;
    }
    // Sem Steam conectada, a função não devolve linha: o card fica zerado (primeiro acesso).
    const stats = ((data ?? []) as unknown as CardStatsRow[]).at(0) ?? null;
    const user = this.auth.user();
    const username = user?.username ?? 'jogador';
    const monthHours = toHours(stats?.month_minutes);
    const card: PlayerCard = {
      name: user?.name ?? 'Jogador',
      username,
      avatarUrl: user?.avatarUrl ?? null,
      playingNow: stats?.current_game ?? null,
      title: null,
      stats: { hours: toHours(stats?.total_minutes), hoursWithFriends: 0, distinctFriends: 0 },
      monthHours,
      estimate: stats?.estimate ?? false,
      steamName: stats?.steam_name ?? null,
      updatedAt: stats?.last_synced_at ?? null,
      games: stats?.month_games ?? 0,
      gameOfMonth: stats?.game_of_month
        ? { name: stats.game_of_month, hours: toHours(stats.game_of_month_minutes) }
        : null,
      partner: null,
      // A Steam é a única fonte por enquanto: PC com 100% (CA11).
      platforms: monthHours > 0 ? [{ platform: 'pc', hours: monthHours }] : [],
    };
    return {
      card,
      friendsCount: 0,
      friendsPlaying: [],
      squads: [],
      question: null,
      inviteLink: `${this.navigation.origin()}/convite/${username}`,
    };
  }

  /** Sem amigos ainda não há pergunta de parceria (CA13): a home nunca chama isto. */
  answerPartnership(): Promise<void> {
    return Promise.reject(new Error('A pergunta de parceria chega com a spec de amigos.'));
  }
}
