import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap, provideRouter } from '@angular/router';

import { AUTH_GATEWAY, AuthUser } from '../../../core/auth/auth.gateway';
import { AuthStore } from '../../../core/auth/auth.store';
import { AuthReturnPage } from './auth-return.page';

const jorge: AuthUser = { name: 'Jorge', username: 'jorge', avatarUrl: null };

describe('AuthReturnPage', () => {
  async function render(
    query: Record<string, string>,
    user: AuthUser | null,
  ): Promise<{ navigate: ReturnType<typeof vi.spyOn>; store: AuthStore; element: HTMLElement }> {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { queryParamMap: convertToParamMap(query) } },
        },
        {
          provide: AUTH_GATEWAY,
          useValue: {
            restoreSession: () => Promise.resolve({ user }),
            onSessionEnded: () => () => undefined,
          },
        },
      ],
    });
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    const store = TestBed.inject(AuthStore);
    const fixture = TestBed.createComponent(AuthReturnPage);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    await store.restore();
    await vi.waitFor(() => expect(navigate).toHaveBeenCalled());
    return { navigate, store, element };
  }

  it('mostra que está entrando enquanto espera a sessão', () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {
          provide: AUTH_GATEWAY,
          useValue: {
            restoreSession: () => new Promise(() => undefined),
            onSessionEnded: () => () => undefined,
          },
        },
      ],
    });
    const fixture = TestBed.createComponent(AuthReturnPage);
    fixture.detectChanges();
    const status = (fixture.nativeElement as HTMLElement).querySelector('[role="status"]');
    expect(status?.textContent).toContain('Entrando…');
  });

  it('com o login feito, vai para o destino pedido sem deixar a volta no histórico (CA2, CA5)', async () => {
    const { navigate } = await render({ next: '/amigos?aba=pedidos', code: 'abc' }, jorge);
    expect(navigate).toHaveBeenCalledWith('/amigos?aba=pedidos', { replaceUrl: true });
  });

  it('sem destino, vai para a tela inicial', async () => {
    const { navigate } = await render({ code: 'abc' }, jorge);
    expect(navigate).toHaveBeenCalledWith('/inicio', { replaceUrl: true });
  });

  it('destino de fora do app vira a tela inicial (CA6)', async () => {
    const { navigate } = await render({ next: 'https://malicioso.test' }, jorge);
    expect(navigate).toHaveBeenCalledWith('/inicio', { replaceUrl: true });
  });

  it('cancelou no Discord: volta ao login com o aviso de cancelado (CA13)', async () => {
    const { navigate, store } = await render(
      { error: 'access_denied', error_description: 'The resource owner denied the request' },
      null,
    );
    expect(navigate).toHaveBeenCalledWith('/login', { replaceUrl: true });
    expect(store.consumeFailure()).toBe('cancelled');
  });

  it('erro do provedor: volta ao login com o aviso de falha (CA14)', async () => {
    const { navigate, store } = await render({ error: 'server_error' }, null);
    expect(navigate).toHaveBeenCalledWith('/login', { replaceUrl: true });
    expect(store.consumeFailure()).toBe('failed');
  });

  it('sem erro e sem sessão (a troca do código falhou): volta ao login com falha (CA14)', async () => {
    const { navigate, store } = await render({ code: 'vencido' }, null);
    expect(navigate).toHaveBeenCalledWith('/login', { replaceUrl: true });
    expect(store.consumeFailure()).toBe('failed');
  });
});
