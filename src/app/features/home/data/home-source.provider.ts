import { DOCUMENT, Provider, inject } from '@angular/core';

import { environment } from '../../../../environments/environment';
import { FakeHomeSource } from './fake-home.source';
import { HOME_DATA_SOURCE, HomeDataSource } from './home.source';
import { SupabaseHomeSource } from './supabase-home.source';

/**
 * Qual home o app usa (spec 003, Parte 3b): no build de produção, sempre a real. Em
 * desenvolvimento também, a não ser que a URL traga `?simular=` (cenários da spec 002).
 */
export function useFakeHome(production: boolean, search: string): boolean {
  return !production && new URLSearchParams(search).has('simular');
}

export function provideHomeSource(production = environment.production): Provider[] {
  return [
    SupabaseHomeSource,
    FakeHomeSource,
    {
      provide: HOME_DATA_SOURCE,
      useFactory: (): HomeDataSource => {
        const search = inject(DOCUMENT).defaultView?.location.search ?? '';
        return useFakeHome(production, search)
          ? inject(FakeHomeSource)
          : inject(SupabaseHomeSource);
      },
    },
  ];
}
