import { TestBed } from '@angular/core/testing';

import { HOME_DATA_SOURCE, HomeData, HomeDataSource } from './home.source';
import { HomeStore } from './home.store';

function homeData(overrides: Partial<HomeData> = {}): HomeData {
  return {
    card: {
      name: 'Ana Souza',
      username: 'ana',
      avatarUrl: null,
      playingNow: null,
      title: 'Sofredor de Souls',
      stats: { hours: 42, hoursWithFriends: 11, distinctFriends: 3 },
      games: 7,
      gameOfMonth: { name: 'Elden Ring', hours: 18 },
      partner: { name: 'Rafa', avatarUrl: null, matches: 18, probable: true },
      platforms: [
        { platform: 'pc', hours: 28 },
        { platform: 'ps5', hours: 12 },
      ],
    },
    steamPublic: false,
    friendsCount: 6,
    friendsPlaying: [
      {
        id: 'bia',
        name: 'Bia',
        avatarUrl: null,
        game: 'Fortnite',
        platform: 'ps5',
        startedAt: '2026-10-16T20:00:00Z',
      },
      {
        id: 'caio',
        name: 'Caio',
        avatarUrl: null,
        game: 'Fortnite',
        platform: 'pc',
        startedAt: '2026-10-16T20:30:00Z',
      },
    ],
    squads: [{ id: 'sexta', name: 'Squad da Sexta', memberIds: ['bia', 'caio'] }],
    question: {
      id: 'q1',
      friendName: 'Rafa',
      game: 'CS2',
      startedAt: '2026-10-15T22:00:00Z',
      endedAt: '2026-10-15T23:40:00Z',
    },
    inviteLink: 'http://localhost/convite/ana',
    ...overrides,
  };
}

function setup(source: Partial<HomeDataSource>): HomeStore {
  TestBed.configureTestingModule({
    providers: [
      {
        provide: HOME_DATA_SOURCE,
        useValue: {
          load: () => Promise.resolve(homeData()),
          answerPartnership: () => Promise.resolve(),
          markSteamPublic: () => Promise.resolve(),
          ...source,
        },
      },
    ],
  });
  return TestBed.inject(HomeStore);
}

describe('HomeStore', () => {
  it('começa carregando, sem dados (CA14)', () => {
    const store = setup({});
    expect(store.status()).toBe('loading');
    expect(store.card()).toBeNull();
    expect(store.progress()).toBeNull();
    expect(store.firstAccess()).toBe(false);
    expect(store.platforms()).toEqual([]);
    expect(store.opportunities()).toEqual([]);
    expect(store.menuSquads()).toEqual([]);
  });

  it('carrega e calcula patente, plataformas, oportunidades e squads do menu', async () => {
    const store = setup({});
    await store.load();
    expect(store.status()).toBe('ready');
    expect(store.card()?.name).toBe('Ana Souza');
    expect(store.progress()?.current.name).toBe('Veterano de lobby');
    expect(store.platforms().map((p) => p.percent)).toEqual([70, 30]);
    expect(store.opportunities()[0].game).toBe('Fortnite');
    expect(store.menuSquads()).toEqual([{ id: 'sexta', name: 'Squad da Sexta', playing: 2 }]);
    expect(store.firstAccess()).toBe(false);
  });

  it('marca o primeiro acesso', async () => {
    const empty = homeData();
    empty.card = {
      ...empty.card,
      stats: { hours: 0, hoursWithFriends: 0, distinctFriends: 0 },
      games: 0,
    };
    const store = setup({ load: () => Promise.resolve(empty) });
    await store.load();
    expect(store.firstAccess()).toBe(true);
  });

  it('erro na carga vira o estado de erro, e "Tentar de novo" carrega (CA15)', async () => {
    const load = vi
      .fn<HomeDataSource['load']>()
      .mockRejectedValueOnce(new Error('rede'))
      .mockResolvedValueOnce(homeData());
    const store = setup({ load });
    await store.load();
    expect(store.status()).toBe('error');
    const retry = store.load();
    expect(store.status()).toBe('loading');
    await retry;
    expect(store.status()).toBe('ready');
  });

  it('só vale a carga mais recente', async () => {
    let resolveFirst: (data: HomeData) => void = () => undefined;
    let rejectFirst: (error: Error) => void = () => undefined;
    const load = vi
      .fn<HomeDataSource['load']>()
      .mockReturnValueOnce(new Promise((resolve) => (resolveFirst = resolve)))
      .mockReturnValueOnce(new Promise((_, reject) => (rejectFirst = reject)))
      .mockResolvedValueOnce(homeData({ friendsCount: 9 }));
    const store = setup({ load });
    const first = store.load();
    const second = store.load();
    const third = store.load();
    await third;
    resolveFirst(homeData({ friendsCount: 1 }));
    rejectFirst(new Error('velha'));
    await Promise.all([first, second]);
    expect(store.status()).toBe('ready');
    expect(store.data()?.friendsCount).toBe(9);
  });

  describe('pergunta de parceria (CA11)', () => {
    it('Joguei: a pergunta some e a parceria deixa de ser provável', async () => {
      const answerPartnership = vi.fn(() => Promise.resolve());
      const store = setup({ answerPartnership });
      await store.load();
      const answer = store.answerPartnership(true);
      expect(store.answering()).toBe(true);
      expect(await answer).toBe(true);
      expect(answerPartnership).toHaveBeenCalledWith('q1', true);
      expect(store.data()?.question).toBeNull();
      expect(store.card()?.partner?.probable).toBe(false);
      expect(store.answering()).toBe(false);
    });

    it('Não joguei: a pergunta some e a parceria continua provável', async () => {
      const store = setup({});
      await store.load();
      expect(await store.answerPartnership(false)).toBe(true);
      expect(store.data()?.question).toBeNull();
      expect(store.card()?.partner?.probable).toBe(true);
    });

    it('Joguei com outro amigo não mexe no parceiro do mês', async () => {
      const data = homeData();
      data.question = { ...data.question!, friendName: 'Bia' };
      const store = setup({ load: () => Promise.resolve(data) });
      await store.load();
      await store.answerPartnership(true);
      expect(store.card()?.partner?.probable).toBe(true);
    });

    it('Joguei sem parceiro do mês mantém o card sem parceiro', async () => {
      const data = homeData();
      data.card = { ...data.card, partner: null };
      const store = setup({ load: () => Promise.resolve(data) });
      await store.load();
      await store.answerPartnership(true);
      expect(store.card()?.partner).toBeNull();
      expect(store.data()?.question).toBeNull();
    });

    it('se não salvar, a pergunta continua', async () => {
      const store = setup({ answerPartnership: () => Promise.reject(new Error('rede')) });
      await store.load();
      expect(await store.answerPartnership(true)).toBe(false);
      expect(store.data()?.question?.id).toBe('q1');
      expect(store.answering()).toBe(false);
    });

    it('sem pergunta, ou já respondendo, não faz nada', async () => {
      const answerPartnership = vi.fn(() => Promise.resolve());
      const store = setup({ answerPartnership });
      expect(await store.answerPartnership(true)).toBe(false);
      await store.load();
      const first = store.answerPartnership(true);
      expect(await store.answerPartnership(false)).toBe(false);
      await first;
      expect(answerPartnership).toHaveBeenCalledTimes(1);
    });
  });

  describe('Steam pública (CA8)', () => {
    it('"Já deixei público" esconde o aviso', async () => {
      const store = setup({});
      await store.load();
      const marking = store.markSteamPublic();
      expect(store.markingSteam()).toBe(true);
      expect(await marking).toBe(true);
      expect(store.data()?.steamPublic).toBe(true);
      expect(store.markingSteam()).toBe(false);
    });

    it('se não salvar, o aviso continua', async () => {
      const store = setup({ markSteamPublic: () => Promise.reject(new Error('rede')) });
      await store.load();
      expect(await store.markSteamPublic()).toBe(false);
      expect(store.data()?.steamPublic).toBe(false);
    });

    it('sem dados, ou já salvando, não faz nada', async () => {
      const markSteamPublic = vi.fn(() => Promise.resolve());
      const store = setup({ markSteamPublic });
      expect(await store.markSteamPublic()).toBe(false);
      await store.load();
      const first = store.markSteamPublic();
      expect(await store.markSteamPublic()).toBe(false);
      await first;
      expect(markSteamPublic).toHaveBeenCalledTimes(1);
    });

    it('uma resposta que chega depois de os dados sumirem é ignorada', async () => {
      let finish: () => void = () => undefined;
      const store = setup({
        markSteamPublic: () => new Promise<void>((resolve) => (finish = resolve)),
      });
      await store.load();
      const marking = store.markSteamPublic();
      store.data.set(null);
      finish();
      expect(await marking).toBe(true);
      expect(store.data()).toBeNull();
    });
  });
});
