import { TestBed } from '@angular/core/testing';

import { AUTH_GATEWAY, AuthUser } from '../../../core/auth/auth.gateway';
import { AuthStore } from '../../../core/auth/auth.store';
import { isFirstAccess } from '../domain/player-card';
import { squadOpportunities } from '../domain/squad-opportunity';
import {
  FAKE_HOME_OPTIONS,
  FakeHomeScenario,
  FakeHomeSource,
  fakeHomeScenarioFrom,
} from './fake-home.source';

const now = new Date(2026, 9, 16, 21, 0);
const user: AuthUser = {
  name: 'Ana Souza',
  username: 'ana',
  avatarUrl: 'https://exemplo.test/ana.png',
};

describe('fakeHomeScenarioFrom', () => {
  it.each([
    ['', 'full'],
    ['?simular=primeiro-acesso', 'first-access'],
    ['?simular=steam-privada', 'steam-private'],
    ['?simular=sem-amigos', 'no-friends-playing'],
    ['?simular=sem-squads', 'no-squads'],
    ['?simular=carregando', 'slow'],
    ['?simular=erro', 'error'],
    ['?simular=qualquer-coisa', 'full'],
  ])('em desenvolvimento, "%s" vira %s', (search, expected) => {
    expect(fakeHomeScenarioFrom(search, false)).toBe(expected);
  });

  it('em produção ignora a URL', () => {
    expect(fakeHomeScenarioFrom('?simular=erro', true)).toBe('full');
  });
});

describe('FAKE_HOME_OPTIONS', () => {
  it('usa os tempos padrão, o cenário cheio e o relógio real', () => {
    const options = TestBed.inject(FAKE_HOME_OPTIONS);
    expect(options).toMatchObject({
      scenario: 'full',
      loadDelayMs: 500,
      slowDelayMs: 3000,
      actionDelayMs: 300,
    });
    expect(options.now()).toBeInstanceOf(Date);
  });
});

describe('FakeHomeSource', () => {
  async function setup(scenario: FakeHomeScenario, signedIn = true): Promise<FakeHomeSource> {
    TestBed.configureTestingModule({
      providers: [
        FakeHomeSource,
        {
          provide: FAKE_HOME_OPTIONS,
          useValue: { scenario, loadDelayMs: 0, slowDelayMs: 5, actionDelayMs: 0, now: () => now },
        },
        {
          provide: AUTH_GATEWAY,
          useValue: { restoreSession: () => Promise.resolve({ user: signedIn ? user : null }) },
        },
      ],
    });
    await TestBed.inject(AuthStore).restore();
    return TestBed.inject(FakeHomeSource);
  }

  it('cheio: card do mês com o nome de quem entrou e parceria provável (CA4, CA6)', async () => {
    const data = await (await setup('full')).load();
    expect(data.card).toMatchObject({
      name: 'Ana Souza',
      username: 'ana',
      avatarUrl: user.avatarUrl,
      playingNow: 'Elden Ring',
      title: 'Sofredor de Souls',
      games: 7,
      gameOfMonth: { name: 'Elden Ring', hours: 18 },
      partner: { name: 'Rafa', probable: true },
    });
    expect(isFirstAccess(data.card)).toBe(false);
    expect(data.steamPublic).toBe(true);
    expect(data.inviteLink).toMatch(/\/convite\/ana$/);
  });

  it('cheio: tem oportunidade de squad e pergunta de parceria de ontem (CA11, CA12)', async () => {
    const data = await (await setup('full')).load();
    const [first] = squadOpportunities(data.squads, data.friendsPlaying);
    expect(first.squad.name).toBe('Squad da Sexta');
    expect(first.game).toBe('Fortnite');
    expect(first.members).toHaveLength(3);
    expect(data.question).toMatchObject({ friendName: 'Rafa', game: 'CS2' });
    const started = new Date(data.question!.startedAt);
    const ended = new Date(data.question!.endedAt);
    expect([started.getDate(), started.getHours(), started.getMinutes()]).toEqual([15, 22, 0]);
    expect([ended.getHours(), ended.getMinutes()]).toEqual([23, 40]);
  });

  it('primeiro acesso: card vazio, Steam privada e sem amigos (CA7)', async () => {
    const data = await (await setup('first-access')).load();
    expect(isFirstAccess(data.card)).toBe(true);
    expect(data.card.title).toBeNull();
    expect(data.card.partner).toBeNull();
    expect(data.steamPublic).toBe(false);
    expect(data.friendsCount).toBe(0);
    expect(data.friendsPlaying).toEqual([]);
    expect(data.squads).toEqual([]);
    expect(data.question).toBeNull();
  });

  it('Steam privada: card cheio com a Steam privada (CA8)', async () => {
    const data = await (await setup('steam-private')).load();
    expect(data.steamPublic).toBe(false);
    expect(isFirstAccess(data.card)).toBe(false);
  });

  it('sem amigos jogando (CA9)', async () => {
    const data = await (await setup('no-friends-playing')).load();
    expect(data.friendsPlaying).toEqual([]);
  });

  it('sem squads (CA10)', async () => {
    const data = await (await setup('no-squads')).load();
    expect(data.squads).toEqual([]);
  });

  it('carregando: demora mais, depois carrega o card cheio (CA14)', async () => {
    vi.useFakeTimers();
    try {
      const source = await setup('slow');
      let done = false;
      const loading = source.load().then(() => (done = true));
      await vi.advanceTimersByTimeAsync(4);
      expect(done).toBe(false);
      await vi.advanceTimersByTimeAsync(1);
      await loading;
      expect(done).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });

  it('erro: a primeira carga falha e a segunda funciona (CA15)', async () => {
    const source = await setup('error');
    await expect(source.load()).rejects.toThrow('Falha simulada');
    await expect(source.load()).resolves.toMatchObject({ card: { name: 'Ana Souza' } });
  });

  it('sem usuário, usa um nome genérico', async () => {
    const data = await (await setup('full', false)).load();
    expect(data.card).toMatchObject({ name: 'Jogador', username: 'jogador', avatarUrl: null });
  });

  it('as ações respondem sem erro', async () => {
    const source = await setup('full');
    await expect(source.answerPartnership()).resolves.toBeUndefined();
    await expect(source.markSteamPublic()).resolves.toBeUndefined();
  });
});
