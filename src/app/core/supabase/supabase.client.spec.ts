import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { SupabaseClient } from '@supabase/supabase-js';

import { environment } from '../../../environments/environment';
import { AUTH_SESSION_STORAGE } from '../platform/auth-session-storage';
import {
  SUPABASE,
  SUPABASE_CONFIG,
  createSupabaseClient,
  supabaseAuthOptions,
} from './supabase.client';

const config = { url: 'https://teste.supabase.co', publishableKey: 'sb_publishable_teste' };
const storage = { getItem: () => null, setItem: () => undefined, removeItem: () => undefined };

describe('supabaseAuthOptions', () => {
  it('no navegador: PKCE, armazenamento sem tokens, sessão persistida e renovada', () => {
    expect(supabaseAuthOptions(true, storage)).toEqual({
      flowType: 'pkce',
      storage,
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    });
  });

  it('no servidor (SSR): não persiste nem renova a sessão', () => {
    expect(supabaseAuthOptions(false, storage)).toMatchObject({
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    });
  });
});

describe('createSupabaseClient', () => {
  it('cria um cliente do Supabase', () => {
    expect(createSupabaseClient(config, false, storage)).toBeInstanceOf(SupabaseClient);
  });
});

describe('tokens de injeção', () => {
  it('SUPABASE_CONFIG lê os valores do environment por padrão', () => {
    expect(TestBed.inject(SUPABASE_CONFIG)).toEqual({
      url: environment.supabaseUrl,
      publishableKey: environment.supabasePublishableKey,
    });
  });

  it('SUPABASE cria o cliente com a configuração e o armazenamento do app', () => {
    TestBed.configureTestingModule({
      providers: [
        { provide: PLATFORM_ID, useValue: 'server' },
        { provide: SUPABASE_CONFIG, useValue: config },
        { provide: AUTH_SESSION_STORAGE, useValue: storage },
      ],
    });
    expect(TestBed.inject(SUPABASE)).toBeInstanceOf(SupabaseClient);
  });
});
