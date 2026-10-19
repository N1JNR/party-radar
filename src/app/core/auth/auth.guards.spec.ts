import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  UrlTree,
  provideRouter,
} from '@angular/router';

import { AUTH_GATEWAY, AuthUser } from './auth.gateway';
import { anonymousOnly, authenticatedOnly, homeOrLogin } from './auth.guards';
import { AuthStore } from './auth.store';

const ana: AuthUser = { name: 'Ana', username: 'ana', avatarUrl: null };

describe('guards de autenticação', () => {
  let finishRestore: (user: AuthUser | null) => void;

  /** Monta o store com a verificação da sessão em andamento; `finishRestore` a conclui. */
  function setup(): AuthStore {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {
          provide: AUTH_GATEWAY,
          useValue: {
            restoreSession: () =>
              new Promise((resolve) => (finishRestore = (user) => resolve({ user }))),
            onSessionEnded: () => () => undefined,
          },
        },
      ],
    });
    const store = TestBed.inject(AuthStore);
    void store.restore();
    return store;
  }

  function run(guard: typeof authenticatedOnly, url = '/inicio'): Promise<unknown> {
    return Promise.resolve(
      TestBed.runInInjectionContext(() =>
        guard({} as ActivatedRouteSnapshot, { url } as RouterStateSnapshot),
      ),
    );
  }

  const path = (result: unknown) => (result as UrlTree).toString();

  it('authenticatedOnly espera a sessão salva e deixa passar quem está logado (CA7)', async () => {
    setup();
    let decided = false;
    const decision = run(authenticatedOnly).then((result) => {
      decided = true;
      return result;
    });
    await Promise.resolve();
    expect(decided).toBe(false);
    finishRestore(ana);
    expect(await decision).toBe(true);
  });

  it('authenticatedOnly manda ao login levando o endereço pedido (CA5)', async () => {
    setup();
    finishRestore(null);
    expect(path(await run(authenticatedOnly, '/amigos?aba=pedidos'))).toBe(
      '/login?next=%2Famigos%3Faba%3Dpedidos',
    );
  });

  it('anonymousOnly deixa passar quem não está logado', async () => {
    setup();
    finishRestore(null);
    expect(await run(anonymousOnly)).toBe(true);
  });

  it('anonymousOnly manda para o início quem já está logado (CA9)', async () => {
    setup();
    finishRestore(ana);
    expect(path(await run(anonymousOnly))).toBe('/inicio');
  });

  it('homeOrLogin leva quem está logado para o início', async () => {
    setup();
    finishRestore(ana);
    expect(path(await run(homeOrLogin))).toBe('/inicio');
  });

  it('homeOrLogin leva quem não está logado para o login', async () => {
    setup();
    finishRestore(null);
    expect(path(await run(homeOrLogin))).toBe('/login');
  });
});
