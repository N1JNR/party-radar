import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthStore } from './auth.store';

/**
 * Telas do app exigem login; sem sessão, vai para o login levando o endereço pedido, para voltar
 * a ele depois de entrar (CA5). Espera a sessão salva ser verificada antes de decidir (CA7).
 */
export const authenticatedOnly: CanActivateFn = async (_route, state) => {
  const store = inject(AuthStore);
  const router = inject(Router);
  await store.whenReady();
  return (
    store.isAuthenticated() ||
    router.createUrlTree(['/login'], { queryParams: { next: state.url } })
  );
};

/** Quem já está logado não vê a tela de login (spec 001, CA9). */
export const anonymousOnly: CanActivateFn = async () => {
  const store = inject(AuthStore);
  const router = inject(Router);
  await store.whenReady();
  return !store.isAuthenticated() || router.parseUrl('/inicio');
};

/** O endereço raiz leva à tela inicial ou ao login, depois de verificar a sessão. */
export const homeOrLogin: CanActivateFn = async () => {
  const store = inject(AuthStore);
  const router = inject(Router);
  await store.whenReady();
  return router.parseUrl(store.isAuthenticated() ? '/inicio' : '/login');
};
