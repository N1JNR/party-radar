import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthStore } from './auth.store';

/** Telas do app exigem login; sem sessão, vai para o login. */
export const authenticatedOnly: CanActivateFn = () =>
  inject(AuthStore).isAuthenticated() || inject(Router).parseUrl('/login');

/** Quem já está logado não vê a tela de login (spec 001, CA9). */
export const anonymousOnly: CanActivateFn = () =>
  !inject(AuthStore).isAuthenticated() || inject(Router).parseUrl('/inicio');
