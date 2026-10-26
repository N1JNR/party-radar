import { DOCUMENT, Provider, inject } from '@angular/core';

import { environment } from '../../../../environments/environment';
import { useFakeHome } from '../../home/data/home-source.provider';
import { FakeSteamSource } from './fake-steam.source';
import { STEAM_SOURCE, SteamSource } from './steam.source';
import { SupabaseSteamSource } from './supabase-steam.source';

/**
 * Qual Steam o app usa: no build de produção, sempre a real. Em desenvolvimento também, a não ser
 * que a URL traga `?simular=` (os mesmos cenários da home).
 */
export function useFakeSteam(production: boolean, search: string): boolean {
  return useFakeHome(production, search);
}

export function provideSteamSource(production = environment.production): Provider[] {
  return [
    SupabaseSteamSource,
    FakeSteamSource,
    {
      provide: STEAM_SOURCE,
      useFactory: (): SteamSource => {
        const search = inject(DOCUMENT).defaultView?.location.search ?? '';
        return useFakeSteam(production, search)
          ? inject(FakeSteamSource)
          : inject(SupabaseSteamSource);
      },
    },
  ];
}
