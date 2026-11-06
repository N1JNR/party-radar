import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PoNotificationService } from '@po-ui/ng-components';

import { ShareService } from '../../../core/platform/share.service';
import { RadarImageService } from '../data/radar-image';
import { SeasonImageService } from '../data/season-image';
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
      monthHours: 42,
      estimate: false,
      steamName: null,
      updatedAt: null,
      games: 7,
      gameOfMonth: { name: 'Elden Ring', hours: 18 },
    },
    games: [
      {
        appId: 1,
        name: 'Elden Ring',
        kind: 'rpg',
        totalHours: 42,
        monthHours: 18,
        previousMonthHours: 12,
      },
    ],
    previousIsEstimate: false,
    season: { number: 1, daysLeft: 52, hours: 42, topGame: 'Elden Ring' },
    trophies: [],
    ...overrides,
  };
}

const firstAccess = (): HomeData =>
  homeData({
    card: {
      ...homeData().card,
      playingNow: null,
      monthHours: 0,
      estimate: false,
      steamName: null,
      updatedAt: null,
      games: 0,
      gameOfMonth: null,
    },
    games: [],
    previousIsEstimate: false,
    season: null,
    trophies: [],
  });

describe('HomePage', () => {
  let fixture: ComponentFixture<HomePage>;
  let element: HTMLElement;
  let information: ReturnType<typeof vi.fn>;
  let success: ReturnType<typeof vi.fn>;
  let error: ReturnType<typeof vi.fn>;

  let go: ReturnType<typeof vi.fn>;
  let createImage: ReturnType<typeof vi.fn>;
  let createSeasonImage: ReturnType<typeof vi.fn>;
  let shareImage: ReturnType<typeof vi.fn>;

  async function render(
    source: Partial<HomeDataSource> = {},
    steam: Partial<SteamSource> = {},
  ): Promise<void> {
    information = vi.fn();
    success = vi.fn();
    error = vi.fn();
    go = vi.fn();
    createImage = vi.fn(() => Promise.resolve(new Blob(['png'], { type: 'image/png' })));
    createSeasonImage = vi.fn(() => Promise.resolve(new Blob(['png'], { type: 'image/png' })));
    shareImage = vi.fn(() => Promise.resolve('shared'));
    TestBed.configureTestingModule({
      providers: [
        { provide: PoNotificationService, useValue: { information, success, error } },
        { provide: RadarImageService, useValue: { create: createImage } },
        { provide: SeasonImageService, useValue: { create: createSeasonImage } },
        { provide: ShareService, useValue: { shareImage } },
        {
          provide: ExternalNavigation,
          useValue: { origin: () => 'http://localhost:4200', go },
        },
        {
          provide: HOME_DATA_SOURCE,
          useValue: {
            load: () => Promise.resolve(homeData()),
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

  it('mostra o jogador, a trilha, o radar e o mês, sem seções de amigos (spec 004, CA1; spec 009, CA3)', async () => {
    await render();
    expect(element.querySelector('h1')?.textContent?.trim()).toBe('Ana Souza');
    expect(element.querySelector('app-rank-track')).not.toBeNull();
    expect(element.querySelector('app-player-radar')).not.toBeNull();
    expect(element.querySelector('app-month-summary')).not.toBeNull();
    for (const gone of [
      'app-squad-race',
      'app-partnership-question',
      'app-squad-opportunity',
      'app-playing-now',
    ]) {
      expect(element.querySelector(gone)).toBeNull();
    }
    expect(element.textContent).not.toContain('Jogando agora');
    expect(element.querySelector('app-strengthen-card')).toBeNull();
    expect(element.querySelector('app-steam-notice')).toBeNull();
  });

  it('carregando: esqueleto sem textos falsos, anunciado ao leitor de tela (CA14)', async () => {
    await render({ load: () => new Promise<HomeData>(() => undefined) });
    expect(element.querySelectorAll('.skeleton').length).toBeGreaterThan(0);
    expect(element.querySelector('[role="status"]')?.textContent).toContain('Carregando seu card');
    expect(element.querySelector('app-player-header')).toBeNull();
    expect(button('Compartilhar meu radar')).toBeUndefined();
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
    expect(element.querySelector('app-player-header')).not.toBeNull();
  });

  it('sem jogos: checklist e aviso, sem compartilhar (spec 004, CA18, CA20)', async () => {
    await render(
      { load: () => Promise.resolve(firstAccess()) },
      {
        account: () => Promise.resolve(steamAccount('private')),
      },
    );
    expect(element.querySelector('app-strengthen-card')).not.toBeNull();
    expect(element.querySelector('app-steam-notice')).not.toBeNull();
    expect(element.textContent).not.toContain('Convidar amigos');
    expect(button('Compartilhar meu radar')).toBeUndefined();
  });

  it('sem a Steam: radar vazio, "Conectar Steam" e nada de compartilhar (spec 004, CA18)', async () => {
    await render(
      { load: () => Promise.resolve(firstAccess()) },
      {
        account: () => Promise.resolve(NOT_CONNECTED),
      },
    );
    expect(element.querySelector('app-player-radar')).not.toBeNull();
    expect(element.querySelector('app-player-radar .radar__shape')).toBeNull();
    expect(button('Conectar Steam')).toBeDefined();
    expect(button('Compartilhar meu radar')).toBeUndefined();
  });

  it('com a Steam privada ou em leitura, o radar dá lugar ao aviso (spec 004, CA20)', async () => {
    await render({}, { account: () => Promise.resolve(steamAccount('private')) });
    expect(element.querySelector('app-steam-notice')).not.toBeNull();
    expect(element.querySelector('app-player-radar')).toBeNull();
    expect(button('Compartilhar meu radar')).toBeUndefined();
  });

  it('compara o mês com o anterior, marcando a estimativa (spec 004, CA11)', async () => {
    await render({ load: () => Promise.resolve(homeData({ previousIsEstimate: true })) });
    expect(element.querySelector('app-month-summary')?.textContent).toContain('estimativa');
  });

  it('"Compartilhar meu radar" gera a imagem e entrega ao aparelho (spec 004, CA14, CA15)', async () => {
    await render();
    button('Compartilhar meu radar')?.click();
    await settle();
    expect(createImage).toHaveBeenCalledTimes(1);
    expect(createImage.mock.calls[0][0]).toMatchObject({
      username: 'ana',
      title: 'Viciado em side quest',
      top: { name: 'Elden Ring' },
    });
    expect(shareImage).toHaveBeenCalledWith(
      expect.any(Blob),
      'meu-radar-party-radar.png',
      'Meu radar no Party Radar',
    );
    expect(success).not.toHaveBeenCalled();
    expect(error).not.toHaveBeenCalled();
  });

  it('mostra a temporada e a carreira na trilha (spec 005, CA1, CA14)', async () => {
    await render();
    const text = element.querySelector('app-rank-track')?.textContent?.replace(/\s+/g, ' ');
    expect(text).toContain('Temporada 1: faltam 52 dias.');
    expect(text).toContain('42h nesta temporada, somando todos os seus jogos.');
    expect(text).toContain('Carreira: 42h na Steam.');
  });

  it('sem troféus, a seção não aparece (spec 005, CA12)', async () => {
    await render();
    expect(element.querySelector('app-season-trophies')).toBeNull();
  });

  it('"Compartilhar temporada" gera a imagem da temporada (spec 005, CA13)', async () => {
    await render();
    button('Compartilhar temporada')?.click();
    await settle();
    expect(createSeasonImage.mock.calls[0][0]).toEqual({
      username: 'ana',
      season: 1,
      rankId: 'veterano',
      hours: 42,
      topGame: 'Elden Ring',
      daysLeft: 52,
    });
    expect(shareImage).toHaveBeenCalledWith(
      expect.any(Blob),
      'temporada-1-party-radar.png',
      'Temporada 1 no Party Radar',
    );
  });

  it('o troféu gera a própria imagem, com a patente gravada (spec 005, CA12, CA13)', async () => {
    await render({
      load: () =>
        Promise.resolve(
          homeData({
            trophies: [{ season: 3, rankId: 'lenda', hours: 130, topGame: 'CS2' }],
          }),
        ),
    });
    expect(element.querySelector('.trophies__name')?.textContent).toBe('Temporada 3: Lenda');
    element.querySelector<HTMLButtonElement>('app-season-trophies button')?.click();
    await settle();
    expect(createSeasonImage.mock.calls[0][0]).toMatchObject({
      season: 3,
      rankId: 'lenda',
      daysLeft: null,
    });
  });

  it('se a imagem da temporada falhar, avisa e continua na tela (spec 004, CA16)', async () => {
    await render();
    createSeasonImage.mockRejectedValue(new Error('canvas'));
    button('Compartilhar temporada')?.click();
    await settle();
    expect(error).toHaveBeenCalledWith('Não foi possível gerar a imagem. Tente de novo.');
    expect(button('Compartilhar temporada')).toBeDefined();
  });

  it('sem horas na temporada, não há compartilhar da temporada (spec 005, CA13)', async () => {
    await render({
      load: () =>
        Promise.resolve(homeData({ season: { number: 1, daysLeft: 52, hours: 0, topGame: null } })),
    });
    expect(button('Compartilhar temporada')).toBeUndefined();
  });

  it('sem Steam conectada, fica em NPC, sem temporada nem troféus (spec 005, CA16)', async () => {
    await render(
      { load: () => Promise.resolve(firstAccess()) },
      {
        account: () => Promise.resolve(NOT_CONNECTED),
      },
    );
    expect(element.querySelector('app-rank-track h2')?.textContent?.trim()).toBe(
      'Sua patente: NPC',
    );
    expect(element.querySelector('app-season-trophies')).toBeNull();
    expect(button('Compartilhar temporada')).toBeUndefined();
  });

  it('avisa quando a imagem foi baixada (spec 004, CA14)', async () => {
    await render();
    shareImage.mockResolvedValue('downloaded');
    button('Compartilhar meu radar')?.click();
    await settle();
    expect(success).toHaveBeenCalledWith('Imagem baixada.');
  });

  it('se a pessoa desistir, não avisa nada', async () => {
    await render();
    shareImage.mockResolvedValue('cancelled');
    button('Compartilhar meu radar')?.click();
    await settle();
    expect(success).not.toHaveBeenCalled();
    expect(error).not.toHaveBeenCalled();
  });

  it('se a imagem não puder ser gerada, avisa e continua na tela (spec 004, CA16)', async () => {
    await render();
    createImage.mockRejectedValue(new Error('canvas'));
    button('Compartilhar meu radar')?.click();
    await settle();
    expect(error).toHaveBeenCalledWith('Não foi possível gerar a imagem. Tente de novo.');
    expect(shareImage).not.toHaveBeenCalled();
    expect(button('Compartilhar meu radar')).toBeDefined();
  });

  it('primeira leitura pendente: "Tentar de novo" com a Steam fora avisa o erro (CA19)', async () => {
    await render(
      {},
      {
        account: () => Promise.resolve(steamAccount(null)),
        recheck: () => Promise.resolve('unavailable'),
      },
    );
    expect(element.querySelector('app-strengthen-card')?.textContent).toContain(
      'Lendo seus dados da Steam…',
    );
    button('Tentar de novo')?.click();
    await settle();
    expect(error).toHaveBeenCalledWith('Não foi possível verificar a Steam agora. Tente de novo.');
    expect(element.querySelector('app-strengthen-card')).not.toBeNull();
  });

  it('primeira leitura pendente: "Tentar de novo" com a Steam pública fecha o quadro (CA19)', async () => {
    // Depois da leitura no servidor, a conta já vem pública na releitura.
    const account = vi
      .fn<SteamSource['account']>()
      .mockResolvedValueOnce(steamAccount(null))
      .mockResolvedValue(steamAccount('public'));
    await render({}, { account });
    button('Tentar de novo')?.click();
    await settle();
    expect(error).not.toHaveBeenCalled();
    expect(element.querySelector('app-strengthen-card')).toBeNull();
    expect(element.querySelector('app-steam-notice')).toBeNull();
  });

  it('sem Steam: "Conectar Steam" leva ao login da própria Steam (spec 003, CA1, CA2)', async () => {
    await render({}, { account: () => Promise.resolve(NOT_CONNECTED) });
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
    const account = vi
      .fn<SteamSource['account']>()
      .mockResolvedValueOnce(steamAccount('private'))
      .mockResolvedValue(steamAccount('public'));
    await render({}, { account });
    button('Já deixei público')?.click();
    await settle();
    expect(success).toHaveBeenCalledWith('Steam pública. Seus dados vão aparecer no card.');
    expect(element.querySelector('app-steam-notice')).toBeNull();
  });

  it('"Já deixei público" com a Steam ainda privada: avisa e mantém (spec 003, CA7)', async () => {
    await render(
      {},
      {
        account: () => Promise.resolve(steamAccount('private')),
        recheck: () => Promise.resolve('private'),
      },
    );
    button('Já deixei público')?.click();
    await settle();
    expect(information).toHaveBeenCalledWith(
      'Ainda está privado. Confira os dois itens na Steam e tente de novo.',
    );
    expect(element.querySelector('app-steam-notice')).not.toBeNull();
  });

  it('se a Steam estiver fora do ar, avisa o erro e mantém o aviso (spec 003, CA15)', async () => {
    await render(
      {},
      {
        account: () => Promise.resolve(steamAccount('private')),
        recheck: () => Promise.resolve('unavailable'),
      },
    );
    button('Já deixei público')?.click();
    await settle();
    expect(error).toHaveBeenCalledWith('Não foi possível verificar a Steam agora. Tente de novo.');
    expect(element.querySelector('app-steam-notice')).not.toBeNull();
  });

  it('relê o card a cada minuto, para o "jogando agora" acompanhar a Steam (spec 003, CA10)', async () => {
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] });
    try {
      const load = vi
        .fn<HomeDataSource['load']>()
        .mockResolvedValueOnce(homeData())
        .mockResolvedValue(homeData({ card: { ...homeData().card, playingNow: 'Hades' } }));
      await render({ load });
      expect(element.querySelector('.player__status')?.textContent).not.toContain('Hades');
      vi.advanceTimersByTime(REFRESH_EVERY_MS);
      await settle();
      expect(load).toHaveBeenCalledTimes(2);
      expect(element.querySelector('.player__status')?.textContent?.trim()).toBe(
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
    await render({ load }, { account: () => Promise.resolve(steamAccount('private')) });
    button('Já deixei público')?.click();
    await settle();
    await settle();
    expect(load).toHaveBeenCalledTimes(2);
  });

  it('"Tentar de novo" com a Steam pública relê o card (spec 003, CA19)', async () => {
    const load = vi.fn<HomeDataSource['load']>(() => Promise.resolve(homeData()));
    await render({ load }, { account: () => Promise.resolve(steamAccount(null)) });
    button('Tentar de novo')?.click();
    await settle();
    await settle();
    expect(load).toHaveBeenCalledTimes(2);
  });
});
