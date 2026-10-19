import { TestBed } from '@angular/core/testing';

import type { AuthGateway } from './auth.gateway';
import {
  FAKE_AUTH_OPTIONS,
  FAKE_USER,
  FakeAuthGateway,
  FakeScenario,
  fakeScenarioFrom,
} from './fake-auth.gateway';

describe('fakeScenarioFrom', () => {
  it.each([
    ['', 'success'],
    ['?simular=cancelado', 'cancelled'],
    ['?simular=erro', 'failed'],
    ['?simular=sem-conexao', 'offline'],
    ['?simular=sessao-expirada', 'session-expired'],
    ['?simular=verificando', 'checking'],
    ['?simular=qualquer-coisa', 'success'],
    ['?outro=1', 'success'],
  ])('em desenvolvimento, "%s" vira %s', (search, expected) => {
    expect(fakeScenarioFrom(search, false)).toBe(expected);
  });

  it('em produção ignora a URL', () => {
    expect(fakeScenarioFrom('?simular=erro', true)).toBe('success');
  });
});

describe('FAKE_AUTH_OPTIONS', () => {
  it('usa os tempos padrão e um cenário válido', () => {
    const options = TestBed.inject(FAKE_AUTH_OPTIONS);
    expect(options.signInDelayMs).toBe(1500);
    expect(options.checkingDelayMs).toBe(3000);
    expect(options.scenario).toBe('success');
  });
});

describe('FakeAuthGateway', () => {
  function setup(scenario: FakeScenario): FakeAuthGateway {
    TestBed.configureTestingModule({
      providers: [
        FakeAuthGateway,
        {
          provide: FAKE_AUTH_OPTIONS,
          useValue: { scenario, signInDelayMs: 1500, checkingDelayMs: 3000 },
        },
      ],
    });
    return TestBed.inject(FakeAuthGateway);
  }

  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  describe('restoreSession', () => {
    it('começa sem sessão', async () => {
      await expect(setup('success').restoreSession()).resolves.toEqual({ user: null });
    });

    it('informa sessão expirada (CA10)', async () => {
      await expect(setup('session-expired').restoreSession()).resolves.toEqual({
        user: null,
        failure: 'session-expired',
      });
    });

    it('demora no cenário "verificando" (CA11)', async () => {
      let done = false;
      const promise = setup('checking')
        .restoreSession()
        .then(() => (done = true));
      await vi.advanceTimersByTimeAsync(2999);
      expect(done).toBe(false);
      await vi.advanceTimersByTimeAsync(1);
      await promise;
      expect(done).toBe(true);
    });
  });

  describe('signIn', () => {
    it('entra como usuário de exemplo depois do tempo de "Abrindo…" (CA12)', async () => {
      const promise = setup('success').signIn('discord');
      await vi.advanceTimersByTimeAsync(1500);
      await expect(promise).resolves.toEqual({
        ok: true,
        user: { ...FAKE_USER, name: 'Ana Souza (discord)' },
      });
    });

    it.each([
      ['cancelled', 'cancelled'],
      ['failed', 'failed'],
    ] as const)('no cenário %s devolve a falha %s', async (scenario, failure) => {
      const promise = setup(scenario).signIn('google');
      await vi.advanceTimersByTimeAsync(1500);
      await expect(promise).resolves.toEqual({ ok: false, failure });
    });

    it('sem conexão falha na hora, sem esperar (CA15)', async () => {
      await expect(setup('offline').signIn('google')).resolves.toEqual({
        ok: false,
        failure: 'offline',
      });
    });

    it('entra normalmente nos cenários que só afetam a sessão', async () => {
      const promise = setup('session-expired').signIn('google');
      await vi.advanceTimersByTimeAsync(1500);
      await expect(promise).resolves.toMatchObject({ ok: true });
    });
  });

  it('signOut resolve', async () => {
    const promise = setup('success').signOut();
    await vi.advanceTimersByTimeAsync(0);
    await expect(promise).resolves.toBeUndefined();
  });

  it('a sessão simulada só termina pelo Sair: o aviso de fim nunca dispara', () => {
    const listener = vi.fn();
    const gateway: AuthGateway = setup('success');
    const stop = gateway.onSessionEnded(listener);
    expect(() => stop()).not.toThrow();
    expect(listener).not.toHaveBeenCalled();
  });
});
