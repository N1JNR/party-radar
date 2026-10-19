import type { AuthProvider, LoginFailure } from '../../../core/auth/auth.gateway';

/** `info`: a pessoa só precisa tentar de novo. `error`: algo falhou do nosso lado ou na rede. */
export type FeedbackTone = 'info' | 'error';

export interface LoginFeedback {
  tone: FeedbackTone;
  message: string;
}

const FEEDBACK: Record<LoginFailure, LoginFeedback> = {
  cancelled: { tone: 'info', message: 'Login cancelado. Tente de novo quando quiser.' },
  failed: { tone: 'error', message: 'Não foi possível entrar agora. Tente de novo em instantes.' },
  offline: { tone: 'error', message: 'Sem conexão. Verifique sua internet.' },
  'session-expired': { tone: 'info', message: 'Sua sessão expirou. Entre de novo.' },
  unavailable: { tone: 'info', message: 'Login com o Google em breve.' },
};

/** Aviso mostrado na tela de login para cada falha (spec 001, CA10, CA13–CA15 e CA23). */
export function feedbackFor(failure: LoginFailure): LoginFeedback {
  return FEEDBACK[failure];
}

const PROVIDER_NAME: Record<AuthProvider, string> = { discord: 'Discord', google: 'Google' };

/**
 * Texto do botão de cada provedor. "Continuar com o Google" segue as diretrizes de marca
 * do Google; durante o redirecionamento, o botão diz para onde está indo (CA12).
 */
export function providerButtonLabel(provider: AuthProvider, opening: boolean): string {
  if (opening) {
    return `Abrindo ${PROVIDER_NAME[provider]}…`;
  }
  return provider === 'google' ? 'Continuar com o Google' : 'Continuar com Discord';
}
