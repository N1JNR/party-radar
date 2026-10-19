import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Router, provideRouter } from '@angular/router';
import { PoMenuComponent, PoNotificationService } from '@po-ui/ng-components';

import { AUTH_GATEWAY, AuthGateway, AuthUser } from '../../core/auth/auth.gateway';
import { AuthStore } from '../../core/auth/auth.store';
import { HOME_DATA_SOURCE } from '../../features/home/data/home.source';
import { HomeStore } from '../../features/home/data/home.store';
import { AppShellComponent } from './app-shell.component';

const user: AuthUser = { name: 'Ana Souza', username: 'ana', avatarUrl: null };

describe('AppShellComponent', () => {
  let fixture: ComponentFixture<AppShellComponent>;
  let element: HTMLElement;
  let information: ReturnType<typeof vi.fn>;

  async function render(gateway: Partial<AuthGateway> = {}): Promise<void> {
    information = vi.fn();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: PoNotificationService, useValue: { information } },
        { provide: HOME_DATA_SOURCE, useValue: {} },
        {
          provide: AUTH_GATEWAY,
          useValue: {
            restoreSession: () => Promise.resolve({ user }),
            onSessionEnded: () => () => undefined,
            ...gateway,
          },
        },
      ],
    });
    await TestBed.inject(AuthStore).restore();
    fixture = TestBed.createComponent(AppShellComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    element = fixture.nativeElement as HTMLElement;
  }

  const menu = () =>
    fixture.debugElement.query(By.directive(PoMenuComponent)).componentInstance as PoMenuComponent;
  const menuButton = () => element.querySelector<HTMLButtonElement>('.shell__menu-button')!;
  const pressEscape = () => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));

  it('mostra o menu com os itens e Meu card como link para /inicio (CA1)', async () => {
    await render();
    const labels = [...element.querySelectorAll('po-menu .po-menu-icon-label')].map((span) =>
      span.textContent?.trim(),
    );
    expect(labels).toEqual(['Meu card', 'Amigos', 'Squads', 'Seus squads', 'Perfil', 'Sair']);
    expect(element.querySelector('po-menu a[href="/inicio"]')).not.toBeNull();
    expect(element.querySelector('router-outlet')).not.toBeNull();
  });

  it('o botão de menu é um botão com nome e estado (CA2, CA17)', async () => {
    await render();
    expect(menuButton().getAttribute('aria-label')).toBe('Abrir menu');
    expect(menuButton().getAttribute('aria-controls')).toBe('app-menu');
    expect(menuButton().getAttribute('aria-expanded')).toBe('false');
  });

  it('abre a gaveta pelo botão e leva o foco para o primeiro item (CA2)', async () => {
    vi.useFakeTimers();
    try {
      await render();
      menuButton().click();
      fixture.detectChanges();
      vi.runAllTimers();
      expect(menu().mobileOpened).toBe(true);
      expect(menuButton().getAttribute('aria-expanded')).toBe('true');
      expect(element.querySelector('.shell--menu-open')).not.toBeNull();
      expect(document.activeElement?.textContent).toContain('Meu card');
    } finally {
      vi.useRealTimers();
    }
  });

  it('Esc fecha a gaveta e devolve o foco ao botão (CA2)', async () => {
    await render();
    menuButton().click();
    pressEscape();
    fixture.detectChanges();
    expect(menu().mobileOpened).toBe(false);
    expect(menuButton().getAttribute('aria-expanded')).toBe('false');
    expect(document.activeElement).toBe(menuButton());
  });

  it('Esc com a gaveta fechada não faz nada', async () => {
    await render();
    const toggle = vi.spyOn(menu(), 'toggleMenuMobile');
    pressEscape();
    expect(toggle).not.toHaveBeenCalled();
  });

  it('Esc depois de o po-menu já ter fechado só devolve o foco', async () => {
    await render();
    menuButton().click();
    menu().mobileOpened = false;
    const toggle = vi.spyOn(menu(), 'toggleMenuMobile');
    pressEscape();
    expect(toggle).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(menuButton());
  });

  it('abrir de novo com a gaveta já aberta não a fecha', async () => {
    await render();
    menu().mobileOpened = true;
    menuButton().click();
    expect(menu().mobileOpened).toBe(true);
  });

  it('tocar fora fecha a gaveta e devolve o foco ao botão (CA2)', async () => {
    await render();
    menuButton().click();
    fixture.detectChanges();
    element.querySelector<HTMLElement>('.po-menu-overlay')!.click();
    fixture.detectChanges();
    expect(menu().mobileOpened).toBe(false);
    expect(menuButton().getAttribute('aria-expanded')).toBe('false');
    expect(document.activeElement).toBe(menuButton());
  });

  it('escolher um destino fecha a gaveta (CA2)', async () => {
    await render();
    menuButton().click();
    fixture.detectChanges();
    element.querySelectorAll<HTMLElement>('po-menu .po-menu-item')[1].click();
    fixture.detectChanges();
    expect(menu().mobileOpened).toBe(false);
    expect(menuButton().getAttribute('aria-expanded')).toBe('false');
  });

  it('interagir com o menu fixo, sem gaveta, não mexe no foco', async () => {
    await render();
    const focus = vi.spyOn(menuButton(), 'focus');
    element.querySelector<HTMLElement>('po-menu')!.dispatchEvent(new KeyboardEvent('keydown'));
    expect(focus).not.toHaveBeenCalled();
  });

  it('destinos que ainda não existem mostram "Em breve" (CA13)', async () => {
    await render();
    menu().menus[1].action?.();
    expect(information).toHaveBeenCalledWith('Em breve: Amigos.');
  });

  it('Sair encerra a sessão e volta para o login sem deixar a tela no histórico (CA3)', async () => {
    const signOut = vi.fn(() => Promise.resolve());
    await render({ signOut });
    const reset = vi.spyOn(TestBed.inject(HomeStore), 'reset');
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    menu().menus[5].action?.();
    await vi.waitFor(() => expect(navigate).toHaveBeenCalled());
    expect(signOut).toHaveBeenCalledTimes(1);
    expect(TestBed.inject(AuthStore).isAuthenticated()).toBe(false);
    expect(navigate).toHaveBeenCalledWith('/login', { replaceUrl: true });
    expect(reset).toHaveBeenCalledTimes(1);
  });

  it('volta para o login mesmo se o servidor falhar ao sair (CA3)', async () => {
    await render({ signOut: () => Promise.reject(new Error('rede')) });
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    menu().menus[5].action?.();
    await vi.waitFor(() => expect(navigate).toHaveBeenCalledWith('/login', { replaceUrl: true }));
  });

  it('mostra os squads da home no menu', async () => {
    await render();
    const squad = { id: 's1', name: 'Squad da Sexta', memberIds: ['bia', 'caio'] };
    const playing = (id: string) => ({
      id,
      name: id,
      avatarUrl: null,
      game: 'CS2',
      platform: 'pc' as const,
      startedAt: '2026-10-16T21:00:00Z',
    });
    TestBed.inject(HomeStore).data.set({
      card: {
        name: 'Ana',
        username: 'ana',
        avatarUrl: null,
        playingNow: null,
        title: null,
        stats: { hours: 0, hoursWithFriends: 0, distinctFriends: 0 },
        games: 0,
        gameOfMonth: null,
        partner: null,
        platforms: [],
      },
      steamPublic: true,
      friendsCount: 2,
      friendsPlaying: [playing('bia'), playing('caio')],
      squads: [squad],
      question: null,
      inviteLink: '',
    });
    TestBed.inject(HomeStore).status.set('ready');
    fixture.detectChanges();
    expect(menu().menus[3].subItems?.[0].label).toBe('Squad da Sexta · 2 jogando');
  });

  it('se o po-menu fechar a gaveta ao redimensionar a janela, o estado acompanha (CA2)', async () => {
    await render();
    menuButton().click();
    fixture.detectChanges();
    menu().mobileOpened = false;
    window.dispatchEvent(new Event('resize'));
    fixture.detectChanges();
    expect(menuButton().getAttribute('aria-expanded')).toBe('false');
    expect(element.querySelector('.shell--menu-open')).toBeNull();
  });

  it('quando a sessão termina sozinha, volta ao login com o aviso de expirada (CA10)', async () => {
    let endSession: () => void = () => undefined;
    await render({
      onSessionEnded: (listener) => {
        endSession = listener;
        return () => undefined;
      },
    });
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    const reset = vi.spyOn(TestBed.inject(HomeStore), 'reset');
    endSession();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(navigate).toHaveBeenCalledWith('/login', { replaceUrl: true });
    expect(reset).toHaveBeenCalled();
    expect(TestBed.inject(AuthStore).consumeFailure()).toBe('session-expired');
  });

  it('ao tocar em Sair, não mostra o aviso de sessão expirada (CA8)', async () => {
    await render({ signOut: () => Promise.resolve() });
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    menu().menus[5].action?.();
    await vi.waitFor(() => expect(navigate).toHaveBeenCalled());
    fixture.detectChanges();
    await fixture.whenStable();
    expect(navigate).toHaveBeenCalledTimes(1);
    expect(TestBed.inject(AuthStore).consumeFailure()).toBeNull();
  });
});
