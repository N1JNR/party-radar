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
import { AUTH_GATEWAY } from './core/auth/auth.gateway';
import { FakeAuthGateway } from './core/auth/fake-auth.gateway';
import { initTheme } from './core/theme/theme.initializer';

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
    // Login simulado (spec 001, Parte 1). A Parte 2 troca pelo gateway do Supabase.
    { provide: AUTH_GATEWAY, useClass: FakeAuthGateway },
  ],
};
