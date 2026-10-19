import { DOCUMENT } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import {
  AUTH_SESSION_STORAGE,
  AuthSessionStorage,
  KeyValueStorage,
  withoutProviderTokens,
} from './auth-session-storage';

function memory(): KeyValueStorage & { data: Map<string, string> } {
  const data = new Map<string, string>();
  return {
    data,
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => void data.set(key, value),
    removeItem: (key) => void data.delete(key),
  };
}

const broken: KeyValueStorage = {
  getItem: () => {
    throw new Error('bloqueado');
  },
  setItem: () => {
    throw new Error('cheio');
  },
  removeItem: () => {
    throw new Error('bloqueado');
  },
};

// Formato da sessão que o supabase-js grava (auth-js `_saveSession`).
const session = {
  access_token: 'jwt-do-party-radar',
  refresh_token: 'refresh-do-party-radar',
  expires_at: 1792500000,
  provider_token: 'token-do-discord',
  provider_refresh_token: 'refresh-do-discord',
  user: { id: 'u1', email: 'ana@exemplo.test' },
};

describe('withoutProviderTokens', () => {
  it('tira os tokens do Discord e do Google e mantém a sessão do Party Radar (CA17)', () => {
    const saved = JSON.parse(withoutProviderTokens(JSON.stringify(session)));
    expect(saved).toEqual({
      access_token: 'jwt-do-party-radar',
      refresh_token: 'refresh-do-party-radar',
      expires_at: 1792500000,
      user: { id: 'u1', email: 'ana@exemplo.test' },
    });
  });

  it('tira mesmo quando só um dos tokens existe', () => {
    const saved = JSON.parse(withoutProviderTokens(JSON.stringify({ a: 1, provider_token: 'x' })));
    expect(saved).toEqual({ a: 1 });
  });

  it.each([
    ['texto que não é JSON', 'verificador-pkce-abc'],
    ['JSON sem tokens', JSON.stringify({ access_token: 'jwt' })],
    ['lista', JSON.stringify(['provider_token'])],
    ['null', 'null'],
    ['número', '42'],
  ])('deixa como está: %s', (_, value) => {
    expect(withoutProviderTokens(value)).toBe(value);
  });
});

describe('AuthSessionStorage', () => {
  it('grava a sessão sem os tokens do provedor e lê de volta', () => {
    const backing = memory();
    const storage = new AuthSessionStorage(backing);
    storage.setItem('sb-auth-token', JSON.stringify(session));
    expect(backing.data.get('sb-auth-token')).not.toContain('token-do-discord');
    expect(backing.data.get('sb-auth-token')).not.toContain('refresh-do-discord');
    expect(JSON.parse(storage.getItem('sb-auth-token') ?? '{}').access_token).toBe(
      'jwt-do-party-radar',
    );
    storage.removeItem('sb-auth-token');
    expect(storage.getItem('sb-auth-token')).toBeNull();
  });

  it('com o armazenamento bloqueado, não quebra o login', () => {
    const storage = new AuthSessionStorage(broken);
    expect(() => storage.setItem('k', 'v')).not.toThrow();
    expect(() => storage.removeItem('k')).not.toThrow();
    expect(storage.getItem('k')).toBeNull();
  });

  it('sem armazenamento (SSR), não guarda nada', () => {
    const storage = new AuthSessionStorage(null);
    storage.setItem('k', 'v');
    storage.removeItem('k');
    expect(storage.getItem('k')).toBeNull();
  });
});

describe('AUTH_SESSION_STORAGE', () => {
  function inject(defaultView: unknown): KeyValueStorage {
    TestBed.configureTestingModule({
      providers: [{ provide: DOCUMENT, useValue: { defaultView } }],
    });
    return TestBed.inject(AUTH_SESSION_STORAGE);
  }

  it('usa o localStorage do navegador', () => {
    const backing = memory();
    inject({ localStorage: backing }).setItem('k', 'v');
    expect(backing.data.get('k')).toBe('v');
  });

  it('sem janela, fica sem armazenamento', () => {
    expect(inject(null).getItem('k')).toBeNull();
  });

  it('se acessar o localStorage lança erro, fica sem armazenamento', () => {
    const view = {};
    Object.defineProperty(view, 'localStorage', {
      get: () => {
        throw new Error('SecurityError');
      },
    });
    expect(inject(view).getItem('k')).toBeNull();
  });
});
