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
import { provideSteamSource } from './features/steam/data/steam-source.provider';
import { initTheme } from './core/theme/theme.initializer';
import { provideHomeSource } from './features/home/data/home-source.provider';

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
    // Steam real pelas Edge Functions; a simulada só em desenvolvimento, com ?simular=.
    ...provideSteamSource(),
    // Home real pelo Supabase (spec 003); a simulada só em desenvolvimento, com ?simular=.
    ...provideHomeSource(),
  ],
};
