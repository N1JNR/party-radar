import { inject } from '@angular/core';
import { Routes } from '@angular/router';

import { anonymousOnly, authenticatedOnly } from './core/auth/auth.guards';
import { AuthStore } from './core/auth/auth.store';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: () => (inject(AuthStore).isAuthenticated() ? 'inicio' : 'login'),
  },
  {
    path: 'login',
    title: 'Entrar | Party Radar',
    canActivate: [anonymousOnly],
    loadComponent: () => import('./features/auth/pages/login.page').then((m) => m.LoginPage),
  },
  // Telas autenticadas, dentro do layout com o menu (spec 002).
  {
    path: '',
    canActivate: [authenticatedOnly],
    loadComponent: () =>
      import('./layout/app-shell/app-shell.component').then((m) => m.AppShellComponent),
    children: [
      {
        path: 'inicio',
        title: 'Meu card | Party Radar',
        loadComponent: () => import('./features/home/pages/home.page').then((m) => m.HomePage),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
