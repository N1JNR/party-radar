import { DOCUMENT } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { AuthError, AuthRetryableFetchError } from '@supabase/supabase-js';

import { SUPABASE } from '../supabase/supabase.client';
import { SupabaseAuthGateway } from './supabase-auth.gateway';

type AuthListener = (event: string) => void;

interface FakeSupabase {
  auth: {
    getSession: ReturnType<typeof vi.fn>;
    signInWithOAuth: ReturnType<typeof vi.fn>;
    signOut: ReturnType<typeof vi.fn>;
    onAuthStateChange: ReturnType<typeof vi.fn>;
  };
  from: ReturnType<typeof vi.fn>;
  query: {
    select: ReturnType<typeof vi.fn>;
    eq: ReturnType<typeof vi.fn>;
    single: ReturnType<typeof vi.fn>;
  };
  emit: (event: string) => void;
  unsubscribe: ReturnType<typeof vi.fn>;
}

const profileRow = {
  display_name: 'Jorge',
  username: 'jorge',
  avatar_url: 'https://cdn.discordapp.com/a.png',
};

function fakeSupabase(): FakeSupabase {
  let listener: AuthListener = () => undefined;
  const unsubscribe = vi.fn();
  const query = {
    select: vi.fn(),
    eq: vi.fn(),
    single: vi.fn(() => Promise.resolve({ data: profileRow, error: null })),
  };
  query.select.mockReturnValue(query);
  query.eq.mockReturnValue(query);
  return {
    auth: {
      getSession: vi.fn(() =>
        Promise.resolve({ data: { session: { user: { id: 'u1' } } }, error: null }),
      ),
      signInWithOAuth: vi.fn(() => Promise.resolve({ data: {}, error: null })),
      signOut: vi.fn(() => Promise.resolve({ error: null })),
      onAuthStateChange: vi.fn((callback: AuthListener) => {
        listener = callback;
        return { data: { subscription: { unsubscribe } } };
      }),
    },
    from: vi.fn(() => query),
    query,
    emit: (event) => listener(event),
    unsubscribe,
  };
}

function setup(supabase: FakeSupabase, onLine = true): SupabaseAuthGateway {
  TestBed.configureTestingModule({
    providers: [
      SupabaseAuthGateway,
      { provide: SUPABASE, useValue: supabase },
      { provide: DOCUMENT, useValue: { defaultView: { navigator: { onLine } } } },
    ],
  });
  return TestBed.inject(SupabaseAuthGateway);
}

/** Resolve se a promessa terminar até o fim da fila de microtarefas. */
async function settled(promise: Promise<unknown>): Promise<boolean> {
  let done = false;
  void promise.then(() => (done = true));
  await new Promise((resolve) => setTimeout(resolve, 0));
  return done;
}

describe('SupabaseAuthGateway', () => {
  describe('restoreSession', () => {
    it('com sessão salva, devolve o perfil do banco (CA4, CA7)', async () => {
      const supabase = fakeSupabase();
      expect(await setup(supabase).restoreSession()).toEqual({
        user: { name: 'Jorge', username: 'jorge', avatarUrl: 'https://cdn.discordapp.com/a.png' },
      });
      expect(supabase.from).toHaveBeenCalledWith('profiles');
      expect(supabase.query.select).toHaveBeenCalledWith('display_name, username, avatar_url');
      expect(supabase.query.eq).toHaveBeenCalledWith('id', 'u1');
    });

    it('sem sessão, não há usuário', async () => {
      const supabase = fakeSupabase();
      supabase.auth.getSession.mockResolvedValue({ data: { session: null }, error: null });
      expect(await setup(supabase).restoreSession()).toEqual({ user: null });
    });

    it('renovação recusada vira sessão expirada (CA10)', async () => {
      const supabase = fakeSupabase();
      supabase.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: new AuthError('Invalid Refresh Token', 400),
      });
      expect(await setup(supabase).restoreSession()).toEqual({
        user: null,
        failure: 'session-expired',
      });
    });

    it('sem internet ao abrir, não diz que a sessão expirou', async () => {
      const supabase = fakeSupabase();
      supabase.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: new AuthRetryableFetchError('Failed to fetch', 0),
      });
      expect(await setup(supabase).restoreSession()).toEqual({ user: null });
    });

    it('se o perfil não puder ser lido, falha (o store trata como sem sessão)', async () => {
      const supabase = fakeSupabase();
      supabase.query.single.mockResolvedValue({ data: null, error: new Error('rede') });
      await expect(setup(supabase).restoreSession()).rejects.toThrow('rede');
    });
  });

  describe('signIn', () => {
    it('com o Discord, sai do app levando o endereço de volta (CA2, CA5)', async () => {
      const supabase = fakeSupabase();
      const redirectTo = 'http://localhost:4200/auth/retorno?next=%2Finicio';
      const signingIn = setup(supabase).signIn('discord', redirectTo);
      expect(await settled(signingIn)).toBe(false);
      expect(supabase.auth.signInWithOAuth).toHaveBeenCalledWith({
        provider: 'discord',
        options: { redirectTo },
      });
    });

    it('se o Supabase recusar antes de sair, falha (CA14)', async () => {
      const supabase = fakeSupabase();
      supabase.auth.signInWithOAuth.mockResolvedValue({ data: {}, error: new Error('x') });
      expect(await setup(supabase).signIn('discord')).toEqual({ ok: false, failure: 'failed' });
    });

    it('sem internet, avisa sem sair do app (CA15)', async () => {
      const supabase = fakeSupabase();
      expect(await setup(supabase, false).signIn('discord')).toEqual({
        ok: false,
        failure: 'offline',
      });
      expect(supabase.auth.signInWithOAuth).not.toHaveBeenCalled();
    });

    it('o Google fica "em breve" até a Parte 2b (CA23)', async () => {
      const supabase = fakeSupabase();
      expect(await setup(supabase).signIn('google')).toEqual({
        ok: false,
        failure: 'unavailable',
      });
      expect(supabase.auth.signInWithOAuth).not.toHaveBeenCalled();
    });
  });

  describe('signOut', () => {
    it('encerra só neste aparelho (CA8)', async () => {
      const supabase = fakeSupabase();
      await setup(supabase).signOut();
      expect(supabase.auth.signOut).toHaveBeenCalledWith({ scope: 'local' });
    });

    it('repassa o erro do servidor', async () => {
      const supabase = fakeSupabase();
      supabase.auth.signOut.mockResolvedValue({ error: new Error('servidor') });
      await expect(setup(supabase).signOut()).rejects.toThrow('servidor');
    });
  });

  describe('onSessionEnded', () => {
    it('avisa quando a sessão termina sozinha e para de avisar ao cancelar (CA10)', () => {
      const supabase = fakeSupabase();
      const listener = vi.fn();
      const stop = setup(supabase).onSessionEnded(listener);
      supabase.emit('TOKEN_REFRESHED');
      expect(listener).not.toHaveBeenCalled();
      supabase.emit('SIGNED_OUT');
      expect(listener).toHaveBeenCalledTimes(1);
      stop();
      expect(supabase.unsubscribe).toHaveBeenCalledTimes(1);
    });

    it('não avisa quando a própria pessoa saiu', async () => {
      const supabase = fakeSupabase();
      const gateway = setup(supabase);
      const listener = vi.fn();
      gateway.onSessionEnded(listener);
      supabase.auth.signOut.mockImplementation(() => {
        supabase.emit('SIGNED_OUT');
        return Promise.resolve({ error: null });
      });
      await gateway.signOut();
      expect(listener).not.toHaveBeenCalled();
    });
  });
});
