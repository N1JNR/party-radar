import { TestBed } from '@angular/core/testing';

import { AUTH_GATEWAY, AuthGateway, AuthUser } from './auth.gateway';
import { AuthStore } from './auth.store';

const user: AuthUser = { name: 'Ana', username: 'ana', avatarUrl: null };

function setup(gateway: Partial<AuthGateway>): AuthStore {
  TestBed.configureTestingModule({
    providers: [{ provide: AUTH_GATEWAY, useValue: gateway }],
  });
  return TestBed.inject(AuthStore);
}

describe('AuthStore', () => {
  it('começa verificando a sessão (CA11)', () => {
    const store = setup({});
    expect(store.status()).toBe('checking');
    expect(store.user()).toBeNull();
    expect(store.isAuthenticated()).toBe(false);
  });

  describe('restore', () => {
    it('fica autenticado quando há sessão salva', async () => {
      const store = setup({ restoreSession: () => Promise.resolve({ user }) });
      await store.restore();
      expect(store.status()).toBe('authenticated');
      expect(store.user()).toEqual(user);
      expect(store.consumeFailure()).toBeNull();
    });

    it('fica anônimo e guarda o aviso quando a sessão expirou (CA10)', async () => {
      const store = setup({
        restoreSession: () => Promise.resolve({ user: null, failure: 'session-expired' }),
      });
      await store.restore();
      expect(store.status()).toBe('anonymous');
      expect(store.consumeFailure()).toBe('session-expired');
      expect(store.consumeFailure()).toBeNull();
    });

    it('fica anônimo se a verificação falhar', async () => {
      const store = setup({ restoreSession: () => Promise.reject(new Error('rede')) });
      await store.restore();
      expect(store.status()).toBe('anonymous');
    });
  });

  describe('signIn', () => {
    it('autentica quando o login dá certo', async () => {
      const store = setup({ signIn: () => Promise.resolve({ ok: true, user }) });
      await expect(store.signIn('discord')).resolves.toEqual({ ok: true, user });
      expect(store.isAuthenticated()).toBe(true);
    });

    it('continua anônimo e devolve a falha', async () => {
      const store = setup({
        restoreSession: () => Promise.resolve({ user: null }),
        signIn: () => Promise.resolve({ ok: false, failure: 'cancelled' }),
      });
      await store.restore();
      await expect(store.signIn('google')).resolves.toEqual({ ok: false, failure: 'cancelled' });
      expect(store.status()).toBe('anonymous');
    });

    it('trata erro inesperado do gateway como falha genérica (CA14)', async () => {
      const store = setup({ signIn: () => Promise.reject(new Error('boom')) });
      await expect(store.signIn('google')).resolves.toEqual({ ok: false, failure: 'failed' });
    });
  });

  describe('signOut', () => {
    it('termina a sessão', async () => {
      const store = setup({
        signIn: () => Promise.resolve({ ok: true, user }),
        signOut: () => Promise.resolve(),
      });
      await store.signIn('discord');
      await store.signOut();
      expect(store.status()).toBe('anonymous');
      expect(store.user()).toBeNull();
    });

    it('termina a sessão local mesmo se o servidor falhar (CA8)', async () => {
      const store = setup({
        signIn: () => Promise.resolve({ ok: true, user }),
        signOut: () => Promise.reject(new Error('rede')),
      });
      await store.signIn('discord');
      await expect(store.signOut()).rejects.toThrow('rede');
      expect(store.isAuthenticated()).toBe(false);
    });
  });
});
