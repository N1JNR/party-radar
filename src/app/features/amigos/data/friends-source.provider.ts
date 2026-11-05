import { DOCUMENT, Provider, inject } from '@angular/core';

import { environment } from '../../../../environments/environment';
import { useFakeHome, usingFakeLogin } from '../../home/data/home-source.provider';
import { FakeFriendsSource } from './fake-friends.source';
import { FRIENDS_SOURCE, FriendsSource } from './friends.source';
import { SupabaseFriendsSource } from './supabase-friends.source';

/** No build de produção, sempre os amigos reais; em desenvolvimento, os mesmos cenários da home. */
export function provideFriendsSource(production = environment.production): Provider[] {
  return [
    SupabaseFriendsSource,
    FakeFriendsSource,
    {
      provide: FRIENDS_SOURCE,
      useFactory: (): FriendsSource => {
        const search = inject(DOCUMENT).defaultView?.location.search ?? '';
        return useFakeHome(production, search) || usingFakeLogin()
          ? inject(FakeFriendsSource)
          : inject(SupabaseFriendsSource);
      },
    },
  ];
}
