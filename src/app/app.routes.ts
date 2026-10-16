import { inject } from '@angular/core';
import { Routes } from '@angular/router';

import { anonymousOnly, authenticatedOnly } from './core/auth/auth.guards';
import { AuthStore } from './core/auth/auth.store';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: () => (inject(AuthStore).isAuthenticated() ? 'inicio' : 'entrar'),
  },
  {
    path: 'entrar',
    title: 'Entrar | Party Radar',
    canActivate: [anonymousOnly],
    loadComponent: () => import('./features/auth/pages/entrar.page').then((m) => m.EntrarPage),
  },
  {
    path: 'inicio',
    title: 'Início | Party Radar',
    canActivate: [authenticatedOnly],
    loadComponent: () => import('./features/home/pages/home.page').then((m) => m.HomePage),
  },
  { path: '**', redirectTo: '' },
];
