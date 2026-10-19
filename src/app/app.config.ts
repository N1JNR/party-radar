import {
  ApplicationConfig,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection,
} from '@angular/core';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter, withComponentInputBinding } from '@angular/router';

import { routes } from './app.routes';
import { provideAuthGateway } from './core/auth/auth-gateway.provider';
import { initTheme } from './core/theme/theme.initializer';
import { FakeHomeSource } from './features/home/data/fake-home.source';
import { HOME_DATA_SOURCE } from './features/home/data/home.source';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    // O PO UI ainda depende do zone.js.
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(withFetch()),
    provideAnimationsAsync(),
    provideClientHydration(withEventReplay()),
    provideAppInitializer(initTheme),
    // Login com o Discord pelo Supabase; o simulado só em desenvolvimento, com ?simular-login=.
    ...provideAuthGateway(),
    // Home simulada (spec 002, layout). A integração troca pela fonte do Supabase.
    { provide: HOME_DATA_SOURCE, useClass: FakeHomeSource },
  ],
};
