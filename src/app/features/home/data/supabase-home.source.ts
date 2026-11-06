import { Injectable, inject } from '@angular/core';

import { AuthStore } from '../../../core/auth/auth.store';
import { SUPABASE } from '../../../core/supabase/supabase.client';
import { PlayerCard } from '../domain/player-card';
import { GameKind, RADAR_AXES } from '../domain/player-radar';
import { sortTrophies } from '../domain/season';
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
  estimate: boolean;
}

/** Uma linha de `my_season()` (spec 005). O jogo pode vir nulo. */
interface SeasonRow {
  season_number: number;
  days_left: number;
  minutes: number;
  top_game: string | null;
}

/** Uma linha de `season_trophies` (spec 005). */
interface TrophyRow {
  season_number: number;
  rank_id: string;
  minutes: number;
  top_game: string | null;
}

/** Uma linha de `my_games()` (spec 004). */
interface GameRow {
  app_id: number;
  game_name: string;
  category: string;
  total_minutes: number;
  month_minutes: number;
  previous_month_minutes: number;
  previous_is_estimate: boolean;
}

const toHours = (minutes: number | null | undefined) =>
  typeof minutes === 'number' && minutes > 0 ? minutes / 60 : 0;

/** Tipo que o app não conhece (um banco mais novo que o app, por exemplo) conta em "Outros". */
const toKind = (category: string): GameKind =>
  (RADAR_AXES as readonly string[]).includes(category) ? (category as GameKind) : 'outros';

/**
 * Home de verdade (spec 003, Parte 3b; spec 005): nome e foto do Discord (perfil) e os números da
 * Steam, calculados no banco por `my_card_stats()`, `my_games()` e `my_season()`, e os troféus das temporadas encerradas.
 */
@Injectable()
export class SupabaseHomeSource implements HomeDataSource {
  private readonly supabase = inject(SUPABASE);
  private readonly auth = inject(AuthStore);

  async load(): Promise<HomeData> {
    const [statsResult, gamesResult, seasonResult, trophiesResult] = await Promise.all([
      this.supabase.rpc('my_card_stats'),
      this.supabase.rpc('my_games'),
      this.supabase.rpc('my_season'),
      this.supabase.from('season_trophies').select('season_number, rank_id, minutes, top_game'),
    ]);
    if (statsResult.error) {
      throw statsResult.error;
    }
    if (gamesResult.error) {
      throw gamesResult.error;
    }
    if (seasonResult.error) {
      throw seasonResult.error;
    }
    if (trophiesResult.error) {
      throw trophiesResult.error;
    }
    // Sem Steam conectada, a função não devolve linha: o card fica zerado (primeiro acesso).
    const stats = ((statsResult.data ?? []) as unknown as CardStatsRow[]).at(0) ?? null;
    const gameRows = (gamesResult.data ?? []) as unknown as GameRow[];
    // Sem Steam conectada, também não há temporada (spec 005, CA16).
    const seasonRow = ((seasonResult.data ?? []) as unknown as SeasonRow[]).at(0) ?? null;
    const trophyRows = (trophiesResult.data ?? []) as TrophyRow[];
    const user = this.auth.user();
    const username = user?.username ?? 'jogador';
    const card: PlayerCard = {
      name: user?.name ?? 'Jogador',
      username,
      avatarUrl: user?.avatarUrl ?? null,
      playingNow: stats?.current_game ?? null,
      monthHours: toHours(stats?.month_minutes),
      estimate: stats?.estimate ?? false,
      steamName: stats?.steam_name ?? null,
      updatedAt: stats?.last_synced_at ?? null,
      games: stats?.month_games ?? 0,
      gameOfMonth: stats?.game_of_month
        ? { name: stats.game_of_month, hours: toHours(stats.game_of_month_minutes) }
        : null,
    };
    return {
      card,
      games: gameRows.map((row) => ({
        appId: row.app_id,
        name: row.game_name,
        kind: toKind(row.category),
        totalHours: toHours(row.total_minutes),
        monthHours: toHours(row.month_minutes),
        previousMonthHours: toHours(row.previous_month_minutes),
      })),
      previousIsEstimate: gameRows.some((row) => row.previous_is_estimate),
      season: seasonRow && {
        number: seasonRow.season_number,
        daysLeft: seasonRow.days_left,
        hours: toHours(seasonRow.minutes),
        topGame: seasonRow.top_game,
      },
      trophies: sortTrophies(
        trophyRows.map((row) => ({
          season: row.season_number,
          rankId: row.rank_id,
          hours: toHours(row.minutes),
          topGame: row.top_game,
        })),
      ),
    };
  }
}
