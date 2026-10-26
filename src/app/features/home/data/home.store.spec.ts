import { TestBed } from '@angular/core/testing';

import {
  NOT_CONNECTED,
  STEAM_SOURCE,
  SteamAccountState,
  SteamSource,
} from '../../steam/data/steam.source';
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
      monthHours: 42,
      estimate: false,
      steamName: null,
      updatedAt: null,
      games: 7,
      gameOfMonth: { name: 'Elden Ring', hours: 18 },
      partner: { id: 'rafa', name: 'Rafa', avatarUrl: null, matches: 18, probable: true },
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
      friendId: 'rafa',
      friendName: 'Rafa',
      game: 'CS2',
      startedAt: '2026-10-15T22:00:00Z',
      endedAt: '2026-10-15T23:40:00Z',
    },
    inviteLink: 'http://localhost/convite/ana',
    ...overrides,
  };
}

const steamAccount = (fields: Partial<SteamAccountState> = {}): SteamAccountState => ({
  connected: true,
  visibility: 'private',
  personaName: 'ana_steam',
  lastSyncedAt: '2026-10-19T18:00:00Z',
  ...fields,
});

function setup(source: Partial<HomeDataSource>, steam: Partial<SteamSource> = {}): HomeStore {
  TestBed.configureTestingModule({
    providers: [
      {
        provide: HOME_DATA_SOURCE,
        useValue: {
          load: () => Promise.resolve(homeData()),
          answerPartnership: () => Promise.resolve(),
          ...source,
        },
      },
      {
        provide: STEAM_SOURCE,
        useValue: {
          account: () => Promise.resolve(steamAccount()),
          recheck: () => Promise.resolve('public'),
          ...steam,
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
    expect(store.menuSquads()).toBeNull();
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
      monthHours: 0,
      estimate: false,
      steamName: null,
      updatedAt: null,
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
    expect(store.menuSquads()).toBeNull();
    const retry = store.load();
    expect(store.status()).toBe('loading');
    await retry;
    expect(store.status()).toBe('ready');
  });

  it('menuSquads não muda de referência quando os squads não mudam', async () => {
    const store = setup({});
    await store.load();
    const before = store.menuSquads();
    store.data.update((data) => (data ? { ...data, steamPublic: true } : data));
    expect(store.menuSquads()).toBe(before);
  });

  it('reset esquece os dados de quem saiu e ignora a carga em andamento', async () => {
    let resolve: (data: HomeData) => void = () => undefined;
    const load = vi
      .fn<HomeDataSource['load']>()
      .mockResolvedValueOnce(homeData())
      .mockReturnValueOnce(new Promise((r) => (resolve = r)));
    const store = setup({ load });
    await store.load();
    const pending = store.load();
    store.reset();
    expect(store.data()).toBeNull();
    expect(store.status()).toBe('loading');
    expect(store.menuSquads()).toBeNull();
    resolve(homeData());
    await pending;
    expect(store.data()).toBeNull();
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

    it('Joguei com outro amigo, mesmo com o mesmo nome, não mexe no parceiro do mês', async () => {
      const data = homeData();
      data.question = { ...data.question!, friendId: 'outro-rafa' };
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

  describe('Steam (spec 003)', () => {
    it('sem Steam conectada, mostra o checklist com "Conectar Steam" (CA1)', async () => {
      const store = setup({}, { account: () => Promise.resolve(NOT_CONNECTED) });
      await store.load();
      expect(store.steamStep()).toBe('not-connected');
      expect(store.showStrengthen()).toBe(true);
      expect(store.showSteamNotice()).toBe(false);
    });

    it('conectada sem a primeira leitura: lendo os dados, com o checklist (CA2, CA19)', async () => {
      const store = setup(
        {},
        { account: () => Promise.resolve(steamAccount({ visibility: null })) },
      );
      await store.load();
      expect(store.steamStep()).toBe('reading');
      expect(store.firstAccess()).toBe(false);
      expect(store.showStrengthen()).toBe(true);
      expect(store.showSteamNotice()).toBe(false);
    });

    it('conectada e privada: mostra o aviso (CA6)', async () => {
      const store = setup({});
      await store.load();
      expect(store.steamStep()).toBe('private');
      expect(store.showSteamNotice()).toBe(true);
      expect(store.showStrengthen()).toBe(false);
    });

    it('se a conta Steam não puder ser lida, a home abre e segue o que ela diz', async () => {
      const store = setup({}, { account: () => Promise.reject(new Error('rede')) });
      await store.load();
      expect(store.status()).toBe('ready');
      expect(store.steam()).toBeNull();
      expect(store.steamStep()).toBe('private');
      store.data.update((data) => (data ? { ...data, steamPublic: true } : data));
      expect(store.steamStep()).toBe('public');
    });

    it('"Já deixei público" com a Steam pública: o aviso some (CA7)', async () => {
      const store = setup({});
      await store.load();
      const checking = store.recheckSteam();
      expect(store.markingSteam()).toBe(true);
      expect(await checking).toBe('public');
      expect(store.steamStep()).toBe('public');
      expect(store.showSteamNotice()).toBe(false);
      expect(store.data()?.steamPublic).toBe(true);
      expect(store.markingSteam()).toBe(false);
    });

    it('"Já deixei público" com a Steam ainda privada: o aviso continua (CA7)', async () => {
      const store = setup({}, { recheck: () => Promise.resolve('private') });
      await store.load();
      expect(await store.recheckSteam()).toBe('private');
      expect(store.showSteamNotice()).toBe(true);
    });

    it('Steam fora do ar ou erro: nada muda (CA15)', async () => {
      const store = setup({}, { recheck: () => Promise.resolve('unavailable') });
      await store.load();
      expect(await store.recheckSteam()).toBe('unavailable');
      expect(store.showSteamNotice()).toBe(true);
    });

    it('erro inesperado ao verificar vira indisponível', async () => {
      const store = setup({}, { recheck: () => Promise.reject(new Error('rede')) });
      await store.load();
      expect(await store.recheckSteam()).toBe('unavailable');
      expect(store.showSteamNotice()).toBe(true);
    });

    it('sem dados, ou já verificando, não faz nada', async () => {
      const recheck = vi.fn<SteamSource['recheck']>(() => Promise.resolve('public'));
      const store = setup({}, { recheck });
      expect(await store.recheckSteam()).toBeNull();
      await store.load();
      const first = store.recheckSteam();
      expect(await store.recheckSteam()).toBeNull();
      await first;
      expect(recheck).toHaveBeenCalledTimes(1);
    });

    it('a resposta que chega depois de sair não mexe em nada', async () => {
      let finish: (value: 'public') => void = () => undefined;
      const store = setup({}, { recheck: () => new Promise((resolve) => (finish = resolve)) });
      await store.load();
      const checking = store.recheckSteam();
      store.reset();
      finish('public');
      expect(await checking).toBe('public');
      expect(store.steam()).toBeNull();
      expect(store.data()).toBeNull();
    });

    it('sair esquece a conta Steam', async () => {
      const store = setup({});
      await store.load();
      store.reset();
      expect(store.steam()).toBeNull();
    });

    it('uma resposta que chega depois de recarregar não mexe nos dados novos', async () => {
      let finish: () => void = () => undefined;
      const fresh = homeData({ question: { ...homeData().question!, id: 'q2' } });
      const load = vi
        .fn<HomeDataSource['load']>()
        .mockResolvedValueOnce(homeData())
        .mockResolvedValueOnce(fresh);
      const store = setup({
        load,
        answerPartnership: () => new Promise<void>((resolve) => (finish = resolve)),
      });
      await store.load();
      const answer = store.answerPartnership(true);
      await store.load();
      finish();
      expect(await answer).toBe(true);
      expect(store.data()?.question?.id).toBe('q2');
      expect(store.card()?.partner?.probable).toBe(true);
    });
  });
});
