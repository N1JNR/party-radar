import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { AuthUser } from '../../../core/auth/auth.gateway';
import { AuthStore } from '../../../core/auth/auth.store';
import { ExternalNavigation } from '../../../core/platform/external-navigation';
import { SUPABASE } from '../../../core/supabase/supabase.client';
import { SupabaseHomeSource } from './supabase-home.source';

const user: AuthUser = { name: 'palmajnr_', username: 'palmajnr_', avatarUrl: 'https://cdn/a.png' };

const statsRow = {
  steam_name: 'N1JNR',
  visibility: 'public',
  current_game: 'ELDEN RING',
  last_synced_at: '2026-10-26T02:55:00Z',
  month_minutes: 540,
  month_games: 2,
  game_of_month: 'ELDEN RING',
  game_of_month_minutes: 300,
  estimate: false,
};

const gameRow = {
  app_id: 1808500,
  game_name: 'ARC Raiders',
  category: 'tiro',
  total_minutes: 18780,
  month_minutes: 900,
  previous_month_minutes: 2610,
  previous_is_estimate: true,
};

const noGames = { data: [], error: null };

const seasonRow = {
  season_number: 2,
  starts_on: '2026-11-03',
  ends_on: '2027-01-01',
  days_left: 52,
  minutes: 2520,
  top_game: 'ARC Raiders',
};

const trophyRow = (season: number) => ({
  season_number: season,
  rank_id: 'veterano',
  minutes: 2760,
  top_game: 'Elden Ring',
});

function setup(
  result: { data: unknown; error: unknown },
  current: AuthUser | null = user,
  games: { data: unknown; error: unknown } = noGames,
  season: { data: unknown; error: unknown } = noGames,
  trophies: { data: unknown; error: unknown } = noGames,
) {
  const rpc = vi.fn((name: string) => {
    if (name === 'my_games') {
      return Promise.resolve(games);
    }
    return Promise.resolve(name === 'my_season' ? season : result);
  });
  const from = vi.fn(() => ({ select: () => Promise.resolve(trophies) }));
  TestBed.configureTestingModule({
    providers: [
      SupabaseHomeSource,
      { provide: SUPABASE, useValue: { rpc, from } },
      { provide: AuthStore, useValue: { user: signal(current) } },
      { provide: ExternalNavigation, useValue: { origin: () => 'http://localhost:4200' } },
    ],
  });
  return { source: TestBed.inject(SupabaseHomeSource), rpc };
}

describe('SupabaseHomeSource', () => {
  it('monta o card com o Discord e os números da Steam (spec 003, CA8, CA9, CA10, CA21)', async () => {
    const { source, rpc } = setup({ data: [statsRow], error: null });
    const data = await source.load();
    expect(rpc).toHaveBeenCalledWith('my_card_stats');
    expect(data.card).toEqual({
      name: 'palmajnr_',
      username: 'palmajnr_',
      avatarUrl: 'https://cdn/a.png',
      playingNow: 'ELDEN RING',
      monthHours: 9,
      estimate: false,
      steamName: 'N1JNR',
      updatedAt: '2026-10-26T02:55:00Z',
      games: 2,
      gameOfMonth: { name: 'ELDEN RING', hours: 5 },
    });
  });

  it('amigos, squads e pergunta ficam vazios até a spec de amigos (CA13)', async () => {
    const { source } = setup({ data: [statsRow], error: null });
    const data = await source.load();
    expect(data.friendsCount).toBe(0);
    expect(data.friendsPlaying).toEqual([]);
    expect(data.squads).toEqual([]);
    expect(data.question).toBeNull();
    expect(data.inviteLink).toBe('http://localhost:4200/convite/palmajnr_');
  });

  it('traz a temporada, com as horas em vez de minutos (spec 005, CA1)', async () => {
    const { source, rpc } = setup({ data: [statsRow], error: null }, user, noGames, {
      data: [seasonRow],
      error: null,
    });
    const data = await source.load();
    expect(rpc).toHaveBeenCalledWith('my_season');
    expect(data.season).toEqual({ number: 2, daysLeft: 52, hours: 42, topGame: 'ARC Raiders' });
  });

  it('sem Steam conectada, não há temporada (spec 005, CA16)', async () => {
    const { source } = setup({ data: [], error: null });
    const data = await source.load();
    expect(data.season).toBeNull();
    expect(data.trophies).toEqual([]);
  });

  it('resposta nula da temporada e dos troféus conta como vazia', async () => {
    const empty = { data: null, error: null };
    const { source } = setup({ data: [], error: null }, user, noGames, empty, empty);
    const data = await source.load();
    expect(data.season).toBeNull();
    expect(data.trophies).toEqual([]);
  });

  it('traz os troféus, do mais recente para o mais antigo (spec 005, CA12)', async () => {
    const { source } = setup({ data: [statsRow], error: null }, user, noGames, noGames, {
      data: [trophyRow(1), trophyRow(3), trophyRow(2)],
      error: null,
    });
    const { trophies } = await source.load();
    expect(trophies.map((trophy) => trophy.season)).toEqual([3, 2, 1]);
    expect(trophies[0]).toEqual({
      season: 3,
      rankId: 'veterano',
      hours: 46,
      topGame: 'Elden Ring',
    });
  });

  it('erro na temporada ou nos troféus sobe, para a home mostrar o erro', async () => {
    const failed = { data: null, error: new Error('rede') };
    const first = setup({ data: [statsRow], error: null }, user, noGames, failed);
    await expect(first.source.load()).rejects.toThrow('rede');
    TestBed.resetTestingModule();
    const second = setup({ data: [statsRow], error: null }, user, noGames, noGames, failed);
    await expect(second.source.load()).rejects.toThrow('rede');
  });

  it('mês da conexão: marca a estimativa', async () => {
    const { source } = setup({ data: [{ ...statsRow, estimate: true }], error: null });
    expect((await source.load()).card.estimate).toBe(true);
  });

  it('sem nada jogado no mês: zerado, sem plataforma e com o primeiro acesso (CA11, CA12)', async () => {
    const { source } = setup({
      data: [
        {
          ...statsRow,
          month_minutes: 0,
          month_games: 0,
          game_of_month: null,
          game_of_month_minutes: null,
        },
      ],
      error: null,
    });
    const { card } = await source.load();
    expect(card.monthHours).toBe(0);
    expect(card.gameOfMonth).toBeNull();
  });

  it('sem Steam conectada (nenhuma linha): card zerado, sem nome na Steam', async () => {
    const { source } = setup({ data: [], error: null });
    const { card } = await source.load();
    expect(card).toMatchObject({
      monthHours: 0,
      games: 0,
      steamName: null,
      updatedAt: null,
      playingNow: null,
      estimate: false,
    });
  });

  it('resposta nula conta como sem linha', async () => {
    const { source } = setup({ data: null, error: null });
    expect((await source.load()).card.games).toBe(0);
  });

  it('sem usuário em memória: nomes neutros', async () => {
    const { source } = setup({ data: [], error: null }, null);
    const data = await source.load();
    expect(data.card).toMatchObject({ name: 'Jogador', username: 'jogador', avatarUrl: null });
    expect(data.inviteLink).toBe('http://localhost:4200/convite/jogador');
  });

  it('erro do banco sobe, para a home mostrar o erro com "Tentar de novo"', async () => {
    const { source } = setup({ data: null, error: new Error('rede') });
    await expect(source.load()).rejects.toThrow('rede');
  });

  it('traz os jogos com tipo e horas, em horas (spec 004, CA9, CA11)', async () => {
    const { source, rpc } = setup({ data: [statsRow], error: null }, user, {
      data: [gameRow],
      error: null,
    });
    const data = await source.load();
    expect(rpc).toHaveBeenCalledWith('my_games');
    expect(data.games).toEqual([
      {
        appId: 1808500,
        name: 'ARC Raiders',
        kind: 'tiro',
        totalHours: 313,
        monthHours: 15,
        previousMonthHours: 43.5,
      },
    ]);
    expect(data.previousIsEstimate).toBe(true);
  });

  it('tipo desconhecido conta em "Outros" (spec 004, CA8)', async () => {
    const { source } = setup({ data: [statsRow], error: null }, user, {
      data: [
        { ...gameRow, category: 'novo-tipo' },
        { ...gameRow, app_id: 2, category: 'outros' },
      ],
      error: null,
    });
    const { games } = await source.load();
    expect(games.map((game) => game.kind)).toEqual(['outros', 'outros']);
  });

  it('sem jogos: lista vazia e mês anterior sem estimativa', async () => {
    const { source } = setup({ data: [statsRow], error: null }, user, { data: null, error: null });
    const data = await source.load();
    expect(data.games).toEqual([]);
    expect(data.previousIsEstimate).toBe(false);
  });

  it('erro ao ler os jogos sobe, para a home mostrar o erro (spec 004, CA21)', async () => {
    const { source } = setup({ data: [statsRow], error: null }, user, {
      data: null,
      error: new Error('jogos'),
    });
    await expect(source.load()).rejects.toThrow('jogos');
  });

  it('não há pergunta de parceria para responder', async () => {
    const { source } = setup({ data: [], error: null });
    await expect(source.answerPartnership()).rejects.toThrow('spec de amigos');
  });
});
