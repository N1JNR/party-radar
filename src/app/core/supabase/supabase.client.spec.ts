import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { createClient } from '@supabase/supabase-js';

import { environment } from '../../../environments/environment';
import { SUPABASE, SUPABASE_CONFIG, createSupabaseClient } from './supabase.client';

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({ fake: 'client' })),
}));

const config = { url: 'https://teste.supabase.co', publishableKey: 'sb_publishable_teste' };
const storage = { getItem: () => null, setItem: () => undefined, removeItem: () => undefined };

describe('createSupabaseClient', () => {
  beforeEach(() => vi.mocked(createClient).mockClear());

  it('persiste e renova a sessão no navegador, com PKCE e o armazenamento sem tokens', () => {
    createSupabaseClient(config, true, storage);
    expect(createClient).toHaveBeenCalledWith(config.url, config.publishableKey, {
      auth: {
        flowType: 'pkce',
        storage,
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  });

  it('não persiste sessão no servidor (SSR)', () => {
    createSupabaseClient(config, false, storage);
    expect(createClient).toHaveBeenCalledWith(config.url, config.publishableKey, {
      auth: {
        flowType: 'pkce',
        storage,
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    });
  });
});

describe('tokens de injeção', () => {
  beforeEach(() => vi.mocked(createClient).mockClear());

  it('SUPABASE_CONFIG lê os valores do environment por padrão', () => {
    expect(TestBed.inject(SUPABASE_CONFIG)).toEqual({
      url: environment.supabaseUrl,
      publishableKey: environment.supabasePublishableKey,
    });
  });

  it('SUPABASE cria o cliente de navegador quando roda no browser', () => {
    TestBed.configureTestingModule({
      providers: [
        { provide: PLATFORM_ID, useValue: 'browser' },
        { provide: SUPABASE_CONFIG, useValue: config },
      ],
    });
    expect(TestBed.inject(SUPABASE)).toEqual({ fake: 'client' });
    expect(vi.mocked(createClient).mock.calls[0][2]?.auth?.persistSession).toBe(true);
  });

  it('SUPABASE cria o cliente sem sessão quando roda no servidor', () => {
    TestBed.configureTestingModule({
      providers: [
        { provide: PLATFORM_ID, useValue: 'server' },
        { provide: SUPABASE_CONFIG, useValue: config },
      ],
    });
    TestBed.inject(SUPABASE);
    expect(vi.mocked(createClient).mock.calls[0][2]?.auth?.persistSession).toBe(false);
  });
});
