import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthStore } from './auth.store';

/** Telas do app exigem login; sem sessão, vai para Entrar. */
export const authenticatedOnly: CanActivateFn = () =>
  inject(AuthStore).isAuthenticated() || inject(Router).parseUrl('/entrar');

/** Quem já está logado não vê a tela Entrar (spec 001, CA9). */
export const anonymousOnly: CanActivateFn = () =>
  !inject(AuthStore).isAuthenticated() || inject(Router).parseUrl('/inicio');
