import { Routes } from '@angular/router';

import { anonymousOnly, authenticatedOnly, homeOrLogin } from './core/auth/auth.guards';

export const routes: Routes = [
  // A raiz espera a sessão salva ser verificada e leva à tela inicial ou ao login (CA7).
  { path: '', pathMatch: 'full', canActivate: [homeOrLogin], children: [] },
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
