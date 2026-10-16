import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  UrlTree,
  provideRouter,
} from '@angular/router';

import { AUTH_GATEWAY } from './auth.gateway';
import { anonymousOnly, authenticatedOnly } from './auth.guards';
import { AuthStore } from './auth.store';

describe('guards de autenticação', () => {
  async function setup(loggedIn: boolean): Promise<void> {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {
          provide: AUTH_GATEWAY,
          useValue: {
            restoreSession: () =>
              Promise.resolve({
                user: loggedIn ? { name: 'Ana', username: 'ana', avatarUrl: null } : null,
              }),
          },
        },
      ],
    });
    await TestBed.inject(AuthStore).restore();
  }

  function run(guard: typeof authenticatedOnly): ReturnType<typeof authenticatedOnly> {
    return TestBed.runInInjectionContext(() =>
      guard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
    );
  }

  function path(result: unknown): string {
    return (result as UrlTree).toString();
  }

  it('authenticatedOnly deixa passar quem está logado', async () => {
    await setup(true);
    expect(run(authenticatedOnly)).toBe(true);
  });

  it('authenticatedOnly manda para Entrar quem não está logado', async () => {
    await setup(false);
    expect(path(run(authenticatedOnly))).toBe('/entrar');
  });

  it('anonymousOnly deixa passar quem não está logado', async () => {
    await setup(false);
    expect(run(anonymousOnly)).toBe(true);
  });

  it('anonymousOnly manda para o início quem já está logado (CA9)', async () => {
    await setup(true);
    expect(path(run(anonymousOnly))).toBe('/inicio');
  });
});
