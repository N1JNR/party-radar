import { feedbackFor } from './login-feedback';
import {
  LoginScreenState,
  currentFeedback,
  failOpening,
  initialLoginScreen,
  isBusy,
  isOpening,
  startOpening,
} from './login-screen';

describe('initialLoginScreen', () => {
  it('começa livre e sem aviso', () => {
    expect(initialLoginScreen()).toEqual({ status: 'idle', feedback: null });
  });

  it('começa com o aviso de sessão expirada quando houver (CA10)', () => {
    expect(initialLoginScreen('session-expired')).toEqual({
      status: 'idle',
      feedback: feedbackFor('session-expired'),
    });
  });

  it('trata null explícito como "sem aviso"', () => {
    expect(initialLoginScreen(null).status).toBe('idle');
    expect(currentFeedback(initialLoginScreen(null))).toBeNull();
  });
});

describe('startOpening', () => {
  it('passa a abrir o provedor tocado (CA12)', () => {
    expect(startOpening(initialLoginScreen(), 'discord')).toEqual({
      status: 'opening',
      provider: 'discord',
    });
  });

  it('tira o aviso anterior da tela ao tentar de novo', () => {
    const next = startOpening(failOpening('failed'), 'google');
    expect(currentFeedback(next)).toBeNull();
  });

  it('ignora um segundo toque enquanto outro login está em andamento (CA12)', () => {
    const opening = startOpening(initialLoginScreen(), 'discord');
    expect(startOpening(opening, 'google')).toBe(opening);
  });
});

describe('failOpening', () => {
  it('libera os botões e mostra o aviso da falha (CA13–CA15)', () => {
    const state = failOpening('offline');
    expect(isBusy(state)).toBe(false);
    expect(currentFeedback(state)).toEqual(feedbackFor('offline'));
  });
});

describe('isBusy e isOpening', () => {
  const opening: LoginScreenState = { status: 'opening', provider: 'google' };

  it('só está ocupado enquanto abre um provedor', () => {
    expect(isBusy(initialLoginScreen())).toBe(false);
    expect(isBusy(opening)).toBe(true);
  });

  it('identifica qual provedor está abrindo', () => {
    expect(isOpening(opening, 'google')).toBe(true);
    expect(isOpening(opening, 'discord')).toBe(false);
    expect(isOpening(initialLoginScreen(), 'google')).toBe(false);
  });

  it('não mostra aviso enquanto abre', () => {
    expect(currentFeedback(opening)).toBeNull();
  });
});
