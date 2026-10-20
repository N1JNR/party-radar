import { TestBed } from '@angular/core/testing';

import { SUPABASE } from '../../../core/supabase/supabase.client';
import { NOT_CONNECTED } from './steam.source';
import { SupabaseSteamSource } from './supabase-steam.source';

function fakeSupabase(row: { data: unknown; error: unknown }, invoke = vi.fn()) {
  const query = { select: vi.fn(), maybeSingle: vi.fn(() => Promise.resolve(row)) };
  query.select.mockReturnValue(query);
  return { from: vi.fn(() => query), functions: { invoke }, query };
}

function setup(supabase: ReturnType<typeof fakeSupabase>): SupabaseSteamSource {
  TestBed.configureTestingModule({
    providers: [SupabaseSteamSource, { provide: SUPABASE, useValue: supabase }],
  });
  return TestBed.inject(SupabaseSteamSource);
}

const empty = () => fakeSupabase({ data: null, error: null });
const httpError = (status: number) => ({ context: { status } });

describe('SupabaseSteamSource', () => {
  describe('account', () => {
    it('sem linha, a Steam não está conectada (CA1)', async () => {
      const supabase = empty();
      expect(await setup(supabase).account()).toEqual(NOT_CONNECTED);
      expect(supabase.from).toHaveBeenCalledWith('steam_accounts');
    });

    it('com linha, devolve visibilidade, nome e última leitura', async () => {
      const supabase = fakeSupabase({
        data: {
          visibility: 'private',
          persona_name: 'ana',
          last_synced_at: '2026-10-19T18:00:00Z',
        },
        error: null,
      });
      expect(await setup(supabase).account()).toEqual({
        connected: true,
        visibility: 'private',
        personaName: 'ana',
        lastSyncedAt: '2026-10-19T18:00:00Z',
      });
    });

    it('antes da primeira leitura, a visibilidade fica vazia (CA2)', async () => {
      const supabase = fakeSupabase({
        data: { visibility: null, persona_name: null, last_synced_at: null },
        error: null,
      });
      expect((await setup(supabase).account()).visibility).toBeNull();
    });

    it('repassa erro de leitura', async () => {
      const supabase = fakeSupabase({ data: null, error: new Error('rede') });
      await expect(setup(supabase).account()).rejects.toThrow('rede');
    });
  });

  describe('connect', () => {
    it('manda a volta da Steam para a steam-connect (CA2)', async () => {
      const invoke = vi.fn(() => Promise.resolve({ data: { status: 'connected' }, error: null }));
      const source = setup(fakeSupabase({ data: null, error: null }, invoke));
      expect(await source.connect({ mode: 'id_res' })).toBe('connected');
      expect(invoke).toHaveBeenCalledWith('steam-connect', {
        body: { openid: { mode: 'id_res' } },
      });
    });

    it('conta já ligada a outro perfil (409) (CA4)', async () => {
      const invoke = vi.fn(() => Promise.resolve({ data: null, error: httpError(409) }));
      expect(await setup(fakeSupabase({ data: null, error: null }, invoke)).connect({})).toBe(
        'taken',
      );
    });

    it.each([
      [{ data: null, error: httpError(400) }],
      [{ data: null, error: httpError(500) }],
      [{ data: null, error: new Error('rede') }],
      [{ data: { status: 'invalid' }, error: null }],
    ])('outros resultados são falha (CA5): %o', async (response) => {
      const invoke = vi.fn(() => Promise.resolve(response));
      expect(await setup(fakeSupabase({ data: null, error: null }, invoke)).connect({})).toBe(
        'failed',
      );
    });
  });

  describe('recheck', () => {
    it('lê de novo pela steam-sync e devolve a visibilidade (CA7)', async () => {
      const invoke = vi.fn(() =>
        Promise.resolve({ data: { status: 'synced', visibility: 'public' }, error: null }),
      );
      expect(await setup(fakeSupabase({ data: null, error: null }, invoke)).recheck()).toBe(
        'public',
      );
      expect(invoke).toHaveBeenCalledWith('steam-sync');
    });

    it('perfil ainda privado', async () => {
      const invoke = vi.fn(() =>
        Promise.resolve({ data: { status: 'synced', visibility: 'private' }, error: null }),
      );
      expect(await setup(fakeSupabase({ data: null, error: null }, invoke)).recheck()).toBe(
        'private',
      );
    });

    it('Steam fora do ar ou erro viram indisponível (CA15)', async () => {
      const invoke = vi.fn(() => Promise.resolve({ data: null, error: httpError(503) }));
      expect(await setup(fakeSupabase({ data: null, error: null }, invoke)).recheck()).toBe(
        'unavailable',
      );
    });
  });
});
