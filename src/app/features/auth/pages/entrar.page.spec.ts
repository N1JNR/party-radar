import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';

import {
  AUTH_GATEWAY,
  AuthGateway,
  LoginFailure,
  SignInResult,
} from '../../../core/auth/auth.gateway';
import { AuthStore } from '../../../core/auth/auth.store';
import { EntrarPage } from './entrar.page';

describe('EntrarPage', () => {
  let resolveSignIn: (result: SignInResult) => void;
  let gateway: AuthGateway;

  async function render(
    pendingFailure: LoginFailure | null = null,
  ): Promise<{ fixture: ComponentFixture<EntrarPage>; element: HTMLElement }> {
    gateway = {
      restoreSession: () =>
        Promise.resolve(
          pendingFailure === 'session-expired'
            ? { user: null, failure: 'session-expired' }
            : { user: null },
        ),
      signIn: vi.fn(() => new Promise<SignInResult>((resolve) => (resolveSignIn = resolve))),
      signOut: () => Promise.resolve(),
    };
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: AUTH_GATEWAY, useValue: gateway }],
    });
    await TestBed.inject(AuthStore).restore();
    const fixture = TestBed.createComponent(EntrarPage);
    fixture.detectChanges();
    await fixture.whenStable();
    return { fixture, element: fixture.nativeElement as HTMLElement };
  }

  function buttons(element: HTMLElement): HTMLButtonElement[] {
    return Array.from(element.querySelectorAll('app-provider-button button'));
  }

  function alertText(element: HTMLElement): string | undefined {
    return element.querySelector('.entrar__alert')?.textContent?.trim();
  }

  async function settle(fixture: ComponentFixture<EntrarPage>): Promise<void> {
    await fixture.whenStable();
    fixture.detectChanges();
  }

  it('mostra o nome, a proposta e os dois botões, Discord primeiro (CA1)', async () => {
    const { element } = await render();
    expect(element.querySelector('h1')?.textContent?.trim()).toBe('Party Radar');
    expect(element.querySelector('.entrar__tagline')?.textContent).toContain('jogando agora');
    expect(buttons(element).map((b) => b.textContent?.trim())).toEqual([
      'Continuar com Discord',
      'Continuar com o Google',
    ]);
    expect(alertText(element)).toBeUndefined();
  });

  it('tem uma região aria-live para os avisos (CA20)', async () => {
    const { element } = await render();
    expect(element.querySelector('.entrar__feedback')?.getAttribute('aria-live')).toBe('polite');
  });

  it('ao tocar, desabilita os dois botões e mostra "Abrindo…" no tocado (CA12)', async () => {
    const { fixture, element } = await render();
    buttons(element)[0].click();
    fixture.detectChanges();
    const [discord, google] = buttons(element);
    expect(discord.textContent?.trim()).toBe('Abrindo Discord…');
    expect(discord.disabled).toBe(true);
    expect(google.disabled).toBe(true);
    expect(gateway.signIn).toHaveBeenCalledWith('discord');
  });

  it('ignora toques repetidos enquanto abre (CA12)', async () => {
    const { fixture, element } = await render();
    const page = fixture.componentInstance as unknown as { signIn(p: string): Promise<void> };
    buttons(element)[1].click();
    void page.signIn('discord');
    expect(gateway.signIn).toHaveBeenCalledTimes(1);
  });

  it('vai para a tela inicial quando o login dá certo', async () => {
    const { fixture, element } = await render();
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    buttons(element)[1].click();
    resolveSignIn({ ok: true, user: { name: 'Ana', username: 'ana', avatarUrl: null } });
    await settle(fixture);
    expect(navigate).toHaveBeenCalledWith('/inicio');
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
      expect(element.querySelector('.entrar__alert--error') !== null).toBe(isError);
      expect(buttons(element).every((b) => !b.disabled)).toBe(true);
      expect(buttons(element)[0].textContent?.trim()).toBe('Continuar com Discord');
    },
  );

  it('devolve o foco ao botão tocado quando o login falha (CA20)', async () => {
    const { fixture, element } = await render();
    document.body.appendChild(element);
    buttons(element)[1].click();
    resolveSignIn({ ok: false, failure: 'failed' });
    await settle(fixture);
    TestBed.tick();
    expect(document.activeElement).toBe(buttons(element)[1]);
    element.remove();
  });

  it('abre já com o aviso de sessão expirada (CA10)', async () => {
    const { element } = await render('session-expired');
    expect(alertText(element)).toBe('Sua sessão expirou. Entre de novo.');
    expect(element.querySelector('.entrar__alert--error')).toBeNull();
  });
});
