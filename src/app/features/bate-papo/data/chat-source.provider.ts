import { DOCUMENT, Provider, inject } from '@angular/core';

import { environment } from '../../../../environments/environment';
import { useFakeHome, usingFakeLogin } from '../../home/data/home-source.provider';
import { CHAT_SOURCE, ChatSource } from './chat.source';
import { FakeChatSource } from './fake-chat.source';
import { SupabaseChatSource } from './supabase-chat.source';

/** No build de produção, sempre o bate-papo real; em desenvolvimento, os mesmos cenários da home. */
export function provideChatSource(production = environment.production): Provider[] {
  return [
    SupabaseChatSource,
    FakeChatSource,
    {
      provide: CHAT_SOURCE,
      useFactory: (): ChatSource => {
        const search = inject(DOCUMENT).defaultView?.location.search ?? '';
        return useFakeHome(production, search) || usingFakeLogin()
          ? inject(FakeChatSource)
          : inject(SupabaseChatSource);
      },
    },
  ];
}
