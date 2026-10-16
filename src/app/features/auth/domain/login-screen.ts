import type { AuthProvider, LoginFailure } from '../../../core/auth/auth.gateway';
import { LoginFeedback, feedbackFor } from './login-feedback';

/** Estado da tela de login: esperando a escolha, ou abrindo um provedor. */
export type LoginScreenState =
  | { status: 'idle'; feedback: LoginFeedback | null }
  | { status: 'opening'; provider: AuthProvider };

/** Estado ao abrir a tela; pode já trazer um aviso (ex.: sessão expirada, CA10). */
export function initialLoginScreen(failure: LoginFailure | null = null): LoginScreenState {
  return { status: 'idle', feedback: failure ? feedbackFor(failure) : null };
}

/** Toque em um provedor. Ignorado se outro login já está em andamento (CA12). */
export function startOpening(state: LoginScreenState, provider: AuthProvider): LoginScreenState {
  if (state.status === 'opening') {
    return state;
  }
  return { status: 'opening', provider };
}

/** O login voltou sem sucesso: a tela libera os botões e mostra o aviso (CA13–CA15). */
export function failOpening(failure: LoginFailure): LoginScreenState {
  return { status: 'idle', feedback: feedbackFor(failure) };
}

export function isBusy(state: LoginScreenState): boolean {
  return state.status === 'opening';
}

export function isOpening(state: LoginScreenState, provider: AuthProvider): boolean {
  return state.status === 'opening' && state.provider === provider;
}

export function currentFeedback(state: LoginScreenState): LoginFeedback | null {
  return state.status === 'idle' ? state.feedback : null;
}
