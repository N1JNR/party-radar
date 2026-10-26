import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { AuthUser } from '../../../core/auth/auth.gateway';
import { AuthStore } from '../../../core/auth/auth.store';
import { ExternalNavigation } from '../../../core/platform/external-navigation';
import { SUPABASE } from '../../../core/supabase/supabase.client';
import { isFirstAccess } from '../domain/player-card';
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
  total_minutes: 820,
  estimate: false,
};

function setup(result: { data: unknown; error: unknown }, current: AuthUser | null = user) {
  const rpc = vi.fn(() => Promise.resolve(result));
  TestBed.configureTestingModule({
    providers: [
      SupabaseHomeSource,
      { provide: SUPABASE, useValue: { rpc } },
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
      title: null,
      stats: { hours: 820 / 60, hoursWithFriends: 0, distinctFriends: 0 },
      monthHours: 9,
      estimate: false,
      steamName: 'N1JNR',
      updatedAt: '2026-10-26T02:55:00Z',
      games: 2,
      gameOfMonth: { name: 'ELDEN RING', hours: 5 },
      partner: null,
      platforms: [{ platform: 'pc', hours: 9 }],
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
    expect(card.platforms).toEqual([]);
    expect(card.gameOfMonth).toBeNull();
    expect(isFirstAccess(card)).toBe(true);
    expect(card.stats.hours).toBeCloseTo(820 / 60);
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
      stats: { hours: 0, hoursWithFriends: 0, distinctFriends: 0 },
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

  it('não há pergunta de parceria para responder', async () => {
    const { source } = setup({ data: [], error: null });
    await expect(source.answerPartnership()).rejects.toThrow('spec de amigos');
  });
});
