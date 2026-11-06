import { TestBed } from '@angular/core/testing';

import { AUTH_GATEWAY, AuthUser } from '../../../core/auth/auth.gateway';
import { AuthStore } from '../../../core/auth/auth.store';
import {
  FAKE_HOME_OPTIONS,
  FakeHomeScenario,
  FakeHomeSource,
  fakeHomeScenarioFrom,
} from './fake-home.source';

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
    });
  });
});

describe('FakeHomeSource', () => {
  async function setup(scenario: FakeHomeScenario, signedIn = true): Promise<FakeHomeSource> {
    TestBed.configureTestingModule({
      providers: [
        FakeHomeSource,
        {
          provide: FAKE_HOME_OPTIONS,
          useValue: { scenario, loadDelayMs: 0, slowDelayMs: 5 },
        },
        {
          provide: AUTH_GATEWAY,
          useValue: {
            restoreSession: () => Promise.resolve({ user: signedIn ? user : null }),
            onSessionEnded: () => () => undefined,
          },
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
      games: 7,
      gameOfMonth: { name: 'Elden Ring', hours: 18 },
    });
  });

  it('cheio: traz jogos de vários tipos, para o radar (spec 004)', async () => {
    const data = await (await setup('full')).load();
    expect(data.games.length).toBeGreaterThan(1);
    expect(new Set(data.games.map((game) => game.kind)).size).toBeGreaterThan(1);
    expect(data.previousIsEstimate).toBe(false);
  });

  it('primeiro acesso: sem jogos (spec 004, CA19)', async () => {
    expect((await (await setup('first-access')).load()).games).toEqual([]);
  });

  it('primeiro acesso: card vazio (CA7)', async () => {
    const data = await (await setup('first-access')).load();
    expect(data.card.monthHours).toBe(0);
    expect(data.card.games).toBe(0);
    expect(data).not.toHaveProperty('friendsPlaying');
  });

  it('Steam privada: card cheio com a Steam privada (CA8)', async () => {
    const data = await (await setup('steam-private')).load();
    expect(data.card.monthHours).toBeGreaterThan(0);
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
});
