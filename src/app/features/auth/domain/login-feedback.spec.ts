import { feedbackFor, providerButtonLabel } from './login-feedback';

describe('feedbackFor', () => {
  it('cancelamento é um aviso informativo (CA13)', () => {
    expect(feedbackFor('cancelled')).toEqual({
      tone: 'info',
      message: 'Login cancelado. Tente de novo quando quiser.',
    });
  });

  it('falha do provedor ou do servidor é um erro (CA14)', () => {
    expect(feedbackFor('failed')).toEqual({
      tone: 'error',
      message: 'Não foi possível entrar agora. Tente de novo em instantes.',
    });
  });

  it('sem internet é um erro que diz como resolver (CA15)', () => {
    expect(feedbackFor('offline')).toEqual({
      tone: 'error',
      message: 'Sem conexão. Verifique sua internet.',
    });
  });

  it('sessão expirada pede para entrar de novo (CA10)', () => {
    expect(feedbackFor('session-expired')).toEqual({
      tone: 'info',
      message: 'Sua sessão expirou. Entre de novo.',
    });
  });
});

describe('providerButtonLabel', () => {
  it('usa os textos aprovados para cada provedor (CA1)', () => {
    expect(providerButtonLabel('discord', false)).toBe('Continuar com Discord');
    expect(providerButtonLabel('google', false)).toBe('Continuar com o Google');
  });

  it('diz para onde está indo enquanto redireciona (CA12)', () => {
    expect(providerButtonLabel('discord', true)).toBe('Abrindo Discord…');
    expect(providerButtonLabel('google', true)).toBe('Abrindo Google…');
  });
});
