import type { LoginFailure } from '../../../core/auth/auth.gateway';

/** Para onde vai quem entrou sem um destino válido. */
export const DEFAULT_DESTINATION = '/inicio';

/** Rota que recebe a volta do provedor (spec 001, Parte 2a). */
export const RETURN_PATH = '/auth/retorno';

const BASE = 'https://party-radar.invalid';

/**
 * Destino depois do login (CA5), só se for um caminho interno do app (CA6). Endereços de fora,
 * `//outro.site`, barras invertidas e as próprias telas de login viram a tela inicial.
 */
export function safeDestination(next: string | null | undefined): string {
  if (!next || !next.startsWith('/') || next.startsWith('//') || next.includes('\\')) {
    return DEFAULT_DESTINATION;
  }
  // Com uma base fixa e um caminho que começa com "/", o URL resolve ".." e não lança erro.
  const url = new URL(next, BASE);
  if (url.origin !== BASE || url.pathname === '/login' || url.pathname === RETURN_PATH) {
    return DEFAULT_DESTINATION;
  }
  return `${url.pathname}${url.search}${url.hash}`;
}

/** Endereço de volta para o provedor, levando o destino seguro (CA5). */
export function returnUrl(origin: string, next: string | null | undefined): string {
  return `${origin}${RETURN_PATH}?next=${encodeURIComponent(safeDestination(next))}`;
}

/**
 * Falha informada na volta do provedor (CA13, CA14). `access_denied` é quem cancelou ou negou
 * a autorização; qualquer outro erro é falha do provedor ou do servidor.
 */
export function returnFailure(error: string | null | undefined): LoginFailure | null {
  if (!error) {
    return null;
  }
  return error === 'access_denied' ? 'cancelled' : 'failed';
}
