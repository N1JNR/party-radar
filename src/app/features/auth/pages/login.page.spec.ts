import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap, provideRouter } from '@angular/router';

import {
  AUTH_GATEWAY,
  AuthGateway,
  LoginFailure,
  SignInResult,
} from '../../../core/auth/auth.gateway';
import { AuthStore } from '../../../core/auth/auth.store';
import { LoginPage } from './login.page';

describe('LoginPage', () => {
  let resolveSignIn: (result: SignInResult) => void;
  let gateway: AuthGateway;

  async function render(
    pendingFailure: LoginFailure | null = null,
    query: Record<string, string> = {},
  ): Promise<{ fixture: ComponentFixture<LoginPage>; element: HTMLElement }> {
    gateway = {
      restoreSession: () =>
        Promise.resolve(
          pendingFailure === 'session-expired'
            ? { user: null, failure: 'session-expired' }
            : { user: null },
        ),
      signIn: vi.fn(() => new Promise<SignInResult>((resolve) => (resolveSignIn = resolve))),
      signOut: () => Promise.resolve(),
      onSessionEnded: () => () => undefined,
    };
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: AUTH_GATEWAY, useValue: gateway },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { queryParamMap: convertToParamMap(query) } },
        },
      ],
    });
    await TestBed.inject(AuthStore).restore();
    const fixture = TestBed.createComponent(LoginPage);
    fixture.detectChanges();
    await fixture.whenStable();
    return { fixture, element: fixture.nativeElement as HTMLElement };
  }

  function buttons(element: HTMLElement): HTMLButtonElement[] {
    return Array.from(element.querySelectorAll('app-provider-button button'));
  }

  function alertText(element: HTMLElement): string | undefined {
    return element.querySelector('.login__alert')?.textContent?.trim();
  }

  async function settle(fixture: ComponentFixture<LoginPage>): Promise<void> {
    await fixture.whenStable();
    fixture.detectChanges();
  }

  it('mostra o nome, a proposta e o botão do Discord (CA1)', async () => {
    const { element } = await render();
    expect(element.querySelector('h1')?.textContent?.trim()).toBe('Party Radar');
    expect(element.querySelector('.login__tagline')?.textContent).toContain('jogando agora');
    expect(buttons(element).map((b) => b.textContent?.trim())).toEqual(['Continuar com Discord']);
    expect(element.querySelector('.login__note')?.textContent?.trim()).toBe(
      'Usamos seu nome e foto do Discord para criar seu perfil.',
    );
    expect(alertText(element)).toBeUndefined();
  });

  it('tem uma região aria-live para os avisos (CA20)', async () => {
    const { element } = await render();
    expect(element.querySelector('.login__feedback')?.getAttribute('aria-live')).toBe('polite');
  });

  // Regressão da T11b: acima dos botões, o aviso os empurrava para baixo e um segundo toque
  // rápido acertava o outro provedor.
  it('mostra o aviso depois dos botões, para eles não mudarem de lugar', async () => {
    const { element } = await render('session-expired');
    const actions = element.querySelector('.login__actions');
    const feedback = element.querySelector('.login__feedback');
    if (!actions || !feedback) throw new Error('estrutura da tela não renderizada');
    expect(
      actions.compareDocumentPosition(feedback) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it('ao tocar, desabilita o botão e mostra "Abrindo Discord…" (CA12)', async () => {
    const { fixture, element } = await render();
    buttons(element)[0].click();
    fixture.detectChanges();
    const [discord] = buttons(element);
    expect(discord.textContent?.trim()).toBe('Abrindo Discord…');
    expect(discord.disabled).toBe(true);
    expect(gateway.signIn).toHaveBeenCalledWith(
      'discord',
      expect.stringMatching(/\/auth\/retorno\?next=%2Finicio$/),
    );
  });

  it('ignora um segundo toque antes de a tela atualizar (CA12)', async () => {
    const { element } = await render();
    const [discord] = buttons(element);
    // Os dois toques acontecem antes da detecção de mudanças: o botão ainda está habilitado.
    discord.click();
    discord.click();
    expect(gateway.signIn).toHaveBeenCalledTimes(1);
  });

  it('vai para a tela inicial quando o login dá certo', async () => {
    const { fixture, element } = await render();
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    buttons(element)[0].click();
    resolveSignIn({ ok: true, user: { name: 'Ana', username: 'ana', avatarUrl: null } });
    await settle(fixture);
    expect(navigate).toHaveBeenCalledWith('/inicio');
  });

  it('leva o destino pedido até a volta do provedor e, sem sair do app, vai a ele (CA5)', async () => {
    const { fixture, element } = await render(null, { next: '/amigos' });
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    buttons(element)[0].click();
    expect(gateway.signIn).toHaveBeenCalledWith(
      'discord',
      expect.stringMatching(/\/auth\/retorno\?next=%2Famigos$/),
    );
    resolveSignIn({ ok: true, user: { name: 'Ana', username: 'ana', avatarUrl: null } });
    await settle(fixture);
    expect(navigate).toHaveBeenCalledWith('/amigos');
  });

  it('voltar do Discord pelo botão do navegador libera os botões (bfcache)', async () => {
    const { fixture, element } = await render();
    buttons(element)[0].click();
    fixture.detectChanges();
    expect(buttons(element).every((button) => button.disabled)).toBe(true);
    window.dispatchEvent(Object.assign(new Event('pageshow'), { persisted: false }));
    fixture.detectChanges();
    expect(buttons(element)[0].disabled).toBe(true);
    window.dispatchEvent(Object.assign(new Event('pageshow'), { persisted: true }));
    fixture.detectChanges();
    expect(buttons(element).every((button) => !button.disabled)).toBe(true);
    expect(buttons(element)[0].textContent?.trim()).toBe('Continuar com Discord');
  });

  it.each([
    ['cancelled', 'Login cancelado. Tente de novo quando quiser.', false],
    ['failed', 'Não foi possível entrar agora. Tente de novo em instantes.', true],
    ['offline', 'Sem conexão. Verifique sua internet.', true],
  ] as const)(
    'falha %s: mostra o aviso e libera os botões (CA13–CA15)',
    async (failure, message, isError) => {
      const { fixture, element } = await render();
      buttons(element)[0].click();
      resolveSignIn({ ok: false, failure });
      await settle(fixture);
      expect(alertText(element)).toBe(message);
      expect(element.querySelector('.login__alert--error') !== null).toBe(isError);
      expect(buttons(element).every((b) => !b.disabled)).toBe(true);
      expect(buttons(element)[0].textContent?.trim()).toBe('Continuar com Discord');
    },
  );

  it('devolve o foco ao botão tocado quando o login falha (CA20)', async () => {
    const { fixture, element } = await render();
    document.body.appendChild(element);
    buttons(element)[0].click();
    resolveSignIn({ ok: false, failure: 'failed' });
    await settle(fixture);
    TestBed.tick();
    expect(document.activeElement).toBe(buttons(element)[0]);
    element.remove();
  });

  it('abre já com o aviso de sessão expirada (CA10)', async () => {
    const { element } = await render('session-expired');
    expect(alertText(element)).toBe('Sua sessão expirou. Entre de novo.');
    expect(element.querySelector('.login__alert--error')).toBeNull();
  });
});
