import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PoNotificationService } from '@po-ui/ng-components';

import { ClipboardService } from '../../../core/platform/clipboard.service';
import { ExternalNavigation } from '../../../core/platform/external-navigation';
import {
  NOT_CONNECTED,
  STEAM_SOURCE,
  SteamAccountState,
  SteamSource,
  SteamVisibility,
} from '../../steam/data/steam.source';
import { HOME_DATA_SOURCE, HomeData, HomeDataSource } from '../data/home.source';
import { HomePage, REFRESH_EVERY_MS } from './home.page';

const steamAccount = (visibility: SteamVisibility | null): SteamAccountState => ({
  connected: true,
  visibility,
  personaName: 'palmajnr',
  lastSyncedAt: '2026-10-19T12:00:00Z',
});

function homeData(overrides: Partial<HomeData> = {}): HomeData {
  return {
    card: {
      name: 'Ana Souza',
      username: 'ana',
      avatarUrl: null,
      playingNow: 'Elden Ring',
      title: 'Sofredor de Souls',
      stats: { hours: 42, hoursWithFriends: 11, distinctFriends: 3 },
      monthHours: 42,
      estimate: false,
      steamName: null,
      updatedAt: null,
      games: 7,
      gameOfMonth: { name: 'Elden Ring', hours: 18 },
      partner: { id: 'rafa', name: 'Rafa', avatarUrl: null, matches: 18, probable: true },
      platforms: [{ platform: 'pc', hours: 28 }],
    },
    friendsCount: 6,
    friendsPlaying: [
      {
        id: 'bia',
        name: 'Bia',
        avatarUrl: null,
        game: 'Fortnite',
        platform: 'ps5',
        startedAt: '2026-10-16T20:00:00Z',
      },
      {
        id: 'caio',
        name: 'Caio',
        avatarUrl: null,
        game: 'Fortnite',
        platform: 'pc',
        startedAt: '2026-10-16T20:30:00Z',
      },
    ],
    squads: [{ id: 'sexta', name: 'Squad da Sexta', memberIds: ['bia', 'caio'] }],
    question: {
      id: 'q1',
      friendId: 'rafa',
      friendName: 'Rafa',
      game: 'CS2',
      startedAt: '2026-10-15T22:00:00Z',
      endedAt: '2026-10-15T23:40:00Z',
    },
    inviteLink: 'http://localhost/convite/ana',
    ...overrides,
  };
}

const firstAccess = (): HomeData =>
  homeData({
    card: {
      ...homeData().card,
      playingNow: null,
      title: null,
      stats: { hours: 0, hoursWithFriends: 0, distinctFriends: 0 },
      monthHours: 0,
      estimate: false,
      steamName: null,
      updatedAt: null,
      games: 0,
      gameOfMonth: null,
      partner: null,
      platforms: [],
    },
    friendsCount: 0,
    friendsPlaying: [],
    squads: [],
    question: null,
  });

describe('HomePage', () => {
  let fixture: ComponentFixture<HomePage>;
  let element: HTMLElement;
  let information: ReturnType<typeof vi.fn>;
  let success: ReturnType<typeof vi.fn>;
  let error: ReturnType<typeof vi.fn>;
  let copy: ReturnType<typeof vi.fn>;

  let go: ReturnType<typeof vi.fn>;

  async function render(
    source: Partial<HomeDataSource> = {},
    copied = true,
    steam: Partial<SteamSource> = {},
  ): Promise<void> {
    information = vi.fn();
    success = vi.fn();
    error = vi.fn();
    go = vi.fn();
    copy = vi.fn(() => Promise.resolve(copied));
    TestBed.configureTestingModule({
      providers: [
        { provide: PoNotificationService, useValue: { information, success, error } },
        { provide: ClipboardService, useValue: { copy } },
        {
          provide: ExternalNavigation,
          useValue: { origin: () => 'http://localhost:4200', go },
        },
        {
          provide: HOME_DATA_SOURCE,
          useValue: {
            load: () => Promise.resolve(homeData()),
            answerPartnership: () => Promise.resolve(),
            ...source,
          },
        },
        {
          provide: STEAM_SOURCE,
          useValue: {
            account: () => Promise.resolve(steamAccount('public')),
            recheck: () => Promise.resolve('public'),
            ...steam,
          },
        },
      ],
    });
    fixture = TestBed.createComponent(HomePage);
    element = fixture.nativeElement as HTMLElement;
    await settle();
  }

  async function settle(): Promise<void> {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  const button = (label: string) =>
    [...element.querySelectorAll<HTMLButtonElement>('po-button button')].find((b) =>
      b.textContent?.includes(label),
    );

  it('mostra o título "Meu card", o card e as seções (CA4, CA11, CA12)', async () => {
    await render();
    expect(element.querySelector('h1')?.textContent?.trim()).toBe('Meu card');
    expect(element.querySelector('app-player-card h2')?.textContent?.trim()).toBe('Ana Souza');
    expect(element.querySelector('app-partnership-question')).not.toBeNull();
    expect(element.querySelector('app-squad-opportunity h2')?.textContent).toContain(
      '2 do Squad da Sexta no Fortnite',
    );
    expect(element.querySelector('app-playing-now .friend')).not.toBeNull();
    expect(element.querySelector('app-strengthen-card')).toBeNull();
    expect(element.querySelector('app-steam-notice')).toBeNull();
  });

  it('carregando: esqueleto sem textos falsos, anunciado ao leitor de tela (CA14)', async () => {
    await render({ load: () => new Promise<HomeData>(() => undefined) });
    expect(element.querySelectorAll('.skeleton').length).toBeGreaterThan(0);
    expect(element.querySelector('[role="status"]')?.textContent).toContain('Carregando seu card');
    expect(element.querySelector('app-player-card')).toBeNull();
    expect(button('Compartilhar card')).toBeUndefined();
  });

  it('erro: mensagem e "Tentar de novo" carrega o card (CA15)', async () => {
    const load = vi
      .fn<HomeDataSource['load']>()
      .mockRejectedValueOnce(new Error('rede'))
      .mockResolvedValueOnce(homeData());
    await render({ load });
    expect(element.querySelector('[role="alert"]')?.textContent).toContain(
      'Não foi possível carregar seu card.',
    );
    button('Tentar de novo')?.click();
    await settle();
    expect(load).toHaveBeenCalledTimes(2);
    expect(element.querySelector('app-player-card')).not.toBeNull();
  });

  it('primeiro acesso: checklist, aviso da Steam e "Nenhum squad ainda" (CA7, CA8, CA10)', async () => {
    await render({ load: () => Promise.resolve(firstAccess()) }, true, {
      account: () => Promise.resolve(steamAccount('private')),
    });
    expect(element.querySelector('app-strengthen-card')).not.toBeNull();
    expect(element.querySelector('app-steam-notice')).not.toBeNull();
    expect(element.querySelector('app-partnership-question')).toBeNull();
    expect(element.querySelector('app-squad-opportunity h2')?.textContent?.trim()).toBe(
      'Nenhum squad ainda',
    );
  });

  it('primeira leitura pendente: "Tentar de novo" com a Steam fora avisa o erro (CA19)', async () => {
    await render({}, true, {
      account: () => Promise.resolve(steamAccount(null)),
      recheck: () => Promise.resolve('unavailable'),
    });
    expect(element.querySelector('app-strengthen-card')?.textContent).toContain(
      'Lendo seus dados da Steam…',
    );
    button('Tentar de novo')?.click();
    await settle();
    expect(error).toHaveBeenCalledWith('Não foi possível verificar a Steam agora. Tente de novo.');
    expect(element.querySelector('app-strengthen-card')).not.toBeNull();
  });

  it('primeira leitura pendente: "Tentar de novo" com a Steam pública fecha o quadro (CA19)', async () => {
    await render({}, true, { account: () => Promise.resolve(steamAccount(null)) });
    button('Tentar de novo')?.click();
    await settle();
    expect(error).not.toHaveBeenCalled();
    expect(element.querySelector('app-strengthen-card')).toBeNull();
    expect(element.querySelector('app-steam-notice')).toBeNull();
  });

  it('sem Steam: "Conectar Steam" leva ao login da própria Steam (spec 003, CA1, CA2)', async () => {
    await render({}, true, { account: () => Promise.resolve(NOT_CONNECTED) });
    expect(element.querySelector('app-strengthen-card')).not.toBeNull();
    button('Conectar Steam')?.click();
    expect(go).toHaveBeenCalledWith(
      expect.stringContaining('https://steamcommunity.com/openid/login?'),
    );
    expect(go.mock.calls[0][0]).toContain(
      encodeURIComponent('http://localhost:4200/steam/retorno'),
    );
  });

  it('"Já deixei público" com a Steam pública: o aviso some (spec 003, CA7)', async () => {
    await render({}, true, { account: () => Promise.resolve(steamAccount('private')) });
    button('Já deixei público')?.click();
    await settle();
    expect(success).toHaveBeenCalledWith('Steam pública. Seus dados vão aparecer no card.');
    expect(element.querySelector('app-steam-notice')).toBeNull();
  });

  it('"Já deixei público" com a Steam ainda privada: avisa e mantém (spec 003, CA7)', async () => {
    await render({}, true, {
      account: () => Promise.resolve(steamAccount('private')),
      recheck: () => Promise.resolve('private'),
    });
    button('Já deixei público')?.click();
    await settle();
    expect(information).toHaveBeenCalledWith(
      'Ainda está privado. Confira os dois itens na Steam e tente de novo.',
    );
    expect(element.querySelector('app-steam-notice')).not.toBeNull();
  });

  it('se a Steam estiver fora do ar, avisa o erro e mantém o aviso (spec 003, CA15)', async () => {
    await render({}, true, {
      account: () => Promise.resolve(steamAccount('private')),
      recheck: () => Promise.resolve('unavailable'),
    });
    button('Já deixei público')?.click();
    await settle();
    expect(error).toHaveBeenCalledWith('Não foi possível verificar a Steam agora. Tente de novo.');
    expect(element.querySelector('app-steam-notice')).not.toBeNull();
  });

  it('Joguei tira a pergunta e o "provável" do parceiro (CA11)', async () => {
    await render();
    expect(element.querySelector('.player-card__probable')).not.toBeNull();
    button('Joguei')?.click();
    await settle();
    expect(element.querySelector('app-partnership-question')).toBeNull();
    expect(element.querySelector('.player-card__probable')).toBeNull();
  });

  it('se não salvar a resposta, avisa o erro e mantém a pergunta', async () => {
    await render({ answerPartnership: () => Promise.reject(new Error('rede')) });
    button('Não joguei')?.click();
    await settle();
    expect(error).toHaveBeenCalledWith('Não foi possível salvar sua resposta. Tente de novo.');
    expect(element.querySelector('app-partnership-question')).not.toBeNull();
  });

  it('Compartilhar card, Ver patentes e Chamar o squad avisam "Em breve" (CA13)', async () => {
    await render();
    button('Compartilhar card')?.click();
    button('Ver patentes')?.click();
    button('Chamar o squad')?.click();
    expect(information.mock.calls.map(([message]) => message)).toEqual([
      'Em breve: Compartilhar card.',
      'Em breve: Ver patentes.',
      'Em breve: Chamar o squad.',
    ]);
  });

  it('Formar squad avisa "Em breve" (CA10)', async () => {
    await render({ load: () => Promise.resolve(homeData({ squads: [] })) });
    button('Formar squad')?.click();
    expect(information).toHaveBeenCalledWith('Em breve: Formar squad.');
  });

  it('Copiar convite copia o link e confirma (CA9)', async () => {
    await render({ load: () => Promise.resolve(homeData({ friendsPlaying: [] })) });
    button('Copiar convite')?.click();
    await settle();
    expect(copy).toHaveBeenCalledWith('http://localhost/convite/ana');
    expect(success).toHaveBeenCalledWith('Link de convite copiado.');
  });

  it('se não der para copiar, mostra o link para copiar à mão', async () => {
    await render({ load: () => Promise.resolve(firstAccess()) }, false);
    button('Copiar convite')?.click();
    await settle();
    expect(information).toHaveBeenCalledWith(
      'Não deu para copiar. Seu link de convite: http://localhost/convite/ana',
    );
  });

  it('relê o card a cada minuto, para o "jogando agora" acompanhar a Steam (spec 003, CA10)', async () => {
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] });
    try {
      const load = vi
        .fn<HomeDataSource['load']>()
        .mockResolvedValueOnce(homeData())
        .mockResolvedValue(homeData({ card: { ...homeData().card, playingNow: 'Hades' } }));
      await render({ load });
      expect(element.querySelector('.player-card__status')?.textContent).not.toContain('Hades');
      vi.advanceTimersByTime(REFRESH_EVERY_MS);
      await settle();
      expect(load).toHaveBeenCalledTimes(2);
      expect(element.querySelector('.player-card__status')?.textContent?.trim()).toBe(
        'Jogando Hades agora',
      );
      fixture.destroy();
      vi.advanceTimersByTime(REFRESH_EVERY_MS);
      expect(load).toHaveBeenCalledTimes(2);
    } finally {
      vi.useRealTimers();
    }
  });

  it('"Já deixei público" com a Steam pública relê o card (spec 003, CA7)', async () => {
    const load = vi.fn<HomeDataSource['load']>(() => Promise.resolve(homeData()));
    await render({ load }, true, { account: () => Promise.resolve(steamAccount('private')) });
    button('Já deixei público')?.click();
    await settle();
    await settle();
    expect(load).toHaveBeenCalledTimes(2);
  });

  it('"Tentar de novo" com a Steam pública relê o card (spec 003, CA19)', async () => {
    const load = vi.fn<HomeDataSource['load']>(() => Promise.resolve(homeData()));
    await render({ load }, true, { account: () => Promise.resolve(steamAccount(null)) });
    button('Tentar de novo')?.click();
    await settle();
    await settle();
    expect(load).toHaveBeenCalledTimes(2);
  });
});
