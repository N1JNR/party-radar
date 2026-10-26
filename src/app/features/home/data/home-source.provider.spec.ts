import { DOCUMENT, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { AuthStore } from '../../../core/auth/auth.store';
import { SUPABASE } from '../../../core/supabase/supabase.client';
import { FakeHomeSource } from './fake-home.source';
import { provideHomeSource, useFakeHome } from './home-source.provider';
import { HOME_DATA_SOURCE } from './home.source';
import { SupabaseHomeSource } from './supabase-home.source';

describe('useFakeHome', () => {
  it('em produção, sempre a home real', () => {
    expect(useFakeHome(true, '?simular=primeiro-acesso')).toBe(false);
  });

  it('em desenvolvimento, a simulada só com ?simular=', () => {
    expect(useFakeHome(false, '?simular=steam-privada')).toBe(true);
    expect(useFakeHome(false, '')).toBe(false);
    expect(useFakeHome(false, '?simular-login=erro')).toBe(false);
  });
});

describe('provideHomeSource', () => {
  function sourceFor(production: boolean | undefined, defaultView: unknown): unknown {
    TestBed.configureTestingModule({
      providers: [
        production === undefined ? provideHomeSource() : provideHomeSource(production),
        { provide: DOCUMENT, useValue: { defaultView } },
        { provide: SUPABASE, useValue: {} },
        { provide: AuthStore, useValue: { user: signal(null) } },
      ],
    });
    return TestBed.inject(HOME_DATA_SOURCE);
  }

  it('fornece a home real por padrão', () => {
    expect(sourceFor(false, { location: { search: '' } })).toBeInstanceOf(SupabaseHomeSource);
  });

  it('por padrão, segue o environment do build', () => {
    expect(sourceFor(undefined, { location: { search: '' } })).toBeInstanceOf(SupabaseHomeSource);
  });

  it('fornece a simulada com ?simular= em desenvolvimento', () => {
    expect(sourceFor(false, { location: { search: '?simular=erro' } })).toBeInstanceOf(
      FakeHomeSource,
    );
  });

  it('sem janela (SSR), usa a real', () => {
    expect(sourceFor(false, null)).toBeInstanceOf(SupabaseHomeSource);
  });
});
