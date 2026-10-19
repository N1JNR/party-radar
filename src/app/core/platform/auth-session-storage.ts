import { DOCUMENT, InjectionToken, inject } from '@angular/core';

/** O mínimo de um armazenamento chave-valor, como o `localStorage`. */
export interface KeyValueStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

/** Campos da sessão do Supabase com os tokens do Discord e do Google (spec 001, CA17). */
const PROVIDER_FIELDS = ['provider_token', 'provider_refresh_token'] as const;

/** Tira os tokens do provedor de uma sessão em JSON. Outros valores passam como estão. */
export function withoutProviderTokens(value: string): string {
  let parsed: unknown;
  try {
    parsed = JSON.parse(value);
  } catch {
    return value;
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return value;
  }
  const session = { ...(parsed as Record<string, unknown>) };
  if (!PROVIDER_FIELDS.some((field) => field in session)) {
    return value;
  }
  for (const field of PROVIDER_FIELDS) {
    delete session[field];
  }
  return JSON.stringify(session);
}

/**
 * Onde o Supabase guarda a sessão no aparelho. Grava sem os tokens do provedor (CA17), e
 * navegador sem armazenamento (modo privado bloqueado, SSR) vira sessão só em memória do
 * cliente. Fica em `core/platform/` para trocar pelo armazenamento do Capacitor no futuro.
 */
export class AuthSessionStorage implements KeyValueStorage {
  constructor(private readonly backing: KeyValueStorage | null) {}

  getItem(key: string): string | null {
    try {
      return this.backing?.getItem(key) ?? null;
    } catch {
      return null;
    }
  }

  setItem(key: string, value: string): void {
    try {
      this.backing?.setItem(key, withoutProviderTokens(value));
    } catch {
      // Sem espaço ou bloqueado: a sessão segue só na memória do cliente.
    }
  }

  removeItem(key: string): void {
    try {
      this.backing?.removeItem(key);
    } catch {
      // Nada a remover se o armazenamento está bloqueado.
    }
  }
}

function localStorageOf(view: Window | null): KeyValueStorage | null {
  try {
    return view?.localStorage ?? null;
  } catch {
    // Alguns navegadores lançam erro só de acessar o localStorage com cookies bloqueados.
    return null;
  }
}

export const AUTH_SESSION_STORAGE = new InjectionToken<KeyValueStorage>('AUTH_SESSION_STORAGE', {
  providedIn: 'root',
  factory: () => new AuthSessionStorage(localStorageOf(inject(DOCUMENT).defaultView)),
});
