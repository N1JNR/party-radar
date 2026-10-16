import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';

import { AUTH_GATEWAY, AuthGateway, AuthUser } from '../../../core/auth/auth.gateway';
import { AuthStore } from '../../../core/auth/auth.store';
import { HomePage } from './home.page';

const user: AuthUser = { name: 'Ana Souza', username: 'ana', avatarUrl: null };

describe('HomePage', () => {
  async function render(
    gateway: Partial<AuthGateway>,
  ): Promise<{ fixture: ComponentFixture<HomePage>; element: HTMLElement }> {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {
          provide: AUTH_GATEWAY,
          useValue: { restoreSession: () => Promise.resolve({ user }), ...gateway },
        },
      ],
    });
    await TestBed.inject(AuthStore).restore();
    const fixture = TestBed.createComponent(HomePage);
    fixture.detectChanges();
    await fixture.whenStable();
    return { fixture, element: fixture.nativeElement as HTMLElement };
  }

  function sairButton(element: HTMLElement): HTMLButtonElement {
    const button = element.querySelector<HTMLButtonElement>('po-button button');
    if (!button) throw new Error('botão Sair não renderizado');
    return button;
  }

  it('cumprimenta pelo nome e mostra o @usuário', async () => {
    const { element } = await render({});
    expect(element.querySelector('h1')?.textContent?.trim()).toBe('Olá, Ana Souza');
    expect(element.querySelector('.inicio__username')?.textContent?.trim()).toBe('@ana');
    expect(element.querySelector('po-avatar')).not.toBeNull();
    expect(sairButton(element).textContent).toContain('Sair');
  });

  it('não mostra nada se não houver usuário', async () => {
    const { element } = await render({ restoreSession: () => Promise.resolve({ user: null }) });
    expect(element.querySelector('h1')).toBeNull();
  });

  it('Sair encerra a sessão e volta para Entrar sem deixar a tela no histórico (CA8)', async () => {
    const signOut = vi.fn(() => Promise.resolve());
    const { fixture, element } = await render({ signOut });
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    sairButton(element).click();
    await fixture.whenStable();
    expect(signOut).toHaveBeenCalledTimes(1);
    expect(TestBed.inject(AuthStore).isAuthenticated()).toBe(false);
    expect(navigate).toHaveBeenCalledWith('/entrar', { replaceUrl: true });
  });

  it('volta para Entrar mesmo se o servidor falhar ao sair (CA8)', async () => {
    const { fixture, element } = await render({
      signOut: () => Promise.reject(new Error('rede')),
    });
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    sairButton(element).click();
    await fixture.whenStable();
    expect(navigate).toHaveBeenCalledWith('/entrar', { replaceUrl: true });
  });
});
