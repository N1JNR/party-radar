import { DOCUMENT } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { SUPABASE } from '../../../core/supabase/supabase.client';
import { FakeSteamSource } from './fake-steam.source';
import { STEAM_SOURCE } from './steam.source';
import { provideSteamSource, useFakeSteam } from './steam-source.provider';
import { SupabaseSteamSource } from './supabase-steam.source';

describe('useFakeSteam', () => {
  it('em produção, sempre a Steam real', () => {
    expect(useFakeSteam(true, '?simular=steam-privada')).toBe(false);
  });

  it('em desenvolvimento, a simulada só com ?simular=', () => {
    expect(useFakeSteam(false, '?simular=steam-privada')).toBe(true);
    expect(useFakeSteam(false, '')).toBe(false);
    expect(useFakeSteam(false, '?simular-login=erro')).toBe(false);
  });
});

describe('provideSteamSource', () => {
  function sourceFor(production: boolean | undefined, defaultView: unknown): unknown {
    TestBed.configureTestingModule({
      providers: [
        production === undefined ? provideSteamSource() : provideSteamSource(production),
        { provide: DOCUMENT, useValue: { defaultView } },
        { provide: SUPABASE, useValue: {} },
      ],
    });
    return TestBed.inject(STEAM_SOURCE);
  }

  it('fornece a Steam real por padrão', () => {
    expect(sourceFor(false, { location: { search: '' } })).toBeInstanceOf(SupabaseSteamSource);
  });

  it('por padrão, segue o environment do build', () => {
    expect(sourceFor(undefined, { location: { search: '' } })).toBeInstanceOf(SupabaseSteamSource);
  });

  it('fornece a simulada com ?simular= em desenvolvimento', () => {
    expect(sourceFor(false, { location: { search: '?simular=primeiro-acesso' } })).toBeInstanceOf(
      FakeSteamSource,
    );
  });

  it('sem janela (SSR), usa a real', () => {
    expect(sourceFor(false, null)).toBeInstanceOf(SupabaseSteamSource);
  });
});
