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
  // Volta do Discord: sem guard, espera a sessão e decide o destino (spec 001, Parte 2a).
  {
    path: 'auth/retorno',
    title: 'Entrando | Party Radar',
    loadComponent: () =>
      import('./features/auth/pages/auth-return.page').then((m) => m.AuthReturnPage),
  },
  // Volta da Steam: exige login para ligar a conta ao perfil (spec 003).
  {
    path: 'steam/retorno',
    title: 'Conectando a Steam | Party Radar',
    canActivate: [authenticatedOnly],
    loadComponent: () =>
      import('./features/steam/pages/steam-return.page').then((m) => m.SteamReturnPage),
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
