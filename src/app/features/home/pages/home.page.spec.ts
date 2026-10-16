import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PoNotificationService } from '@po-ui/ng-components';

import { ClipboardService } from '../../../core/platform/clipboard.service';
import { HOME_DATA_SOURCE, HomeData, HomeDataSource } from '../data/home.source';
import { HomePage } from './home.page';

function homeData(overrides: Partial<HomeData> = {}): HomeData {
  return {
    card: {
      name: 'Ana Souza',
      username: 'ana',
      avatarUrl: null,
      playingNow: 'Elden Ring',
      title: 'Sofredor de Souls',
      stats: { hours: 42, hoursWithFriends: 11, distinctFriends: 3 },
      games: 7,
      gameOfMonth: { name: 'Elden Ring', hours: 18 },
      partner: { name: 'Rafa', avatarUrl: null, matches: 18, probable: true },
      platforms: [{ platform: 'pc', hours: 28 }],
    },
    steamPublic: true,
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
      games: 0,
      gameOfMonth: null,
      partner: null,
      platforms: [],
    },
    steamPublic: false,
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

  async function render(source: Partial<HomeDataSource> = {}, copied = true): Promise<void> {
    information = vi.fn();
    success = vi.fn();
    error = vi.fn();
    copy = vi.fn(() => Promise.resolve(copied));
    TestBed.configureTestingModule({
      providers: [
        { provide: PoNotificationService, useValue: { information, success, error } },
        { provide: ClipboardService, useValue: { copy } },
        {
          provide: HOME_DATA_SOURCE,
          useValue: {
            load: () => Promise.resolve(homeData()),
            answerPartnership: () => Promise.resolve(),
            markSteamPublic: () => Promise.resolve(),
            ...source,
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
    await render({ load: () => Promise.resolve(firstAccess()) });
    expect(element.querySelector('app-strengthen-card')).not.toBeNull();
    expect(element.querySelector('app-steam-notice')).not.toBeNull();
    expect(element.querySelector('app-partnership-question')).toBeNull();
    expect(element.querySelector('app-squad-opportunity h2')?.textContent?.trim()).toBe(
      'Nenhum squad ainda',
    );
  });

  it('"Já deixei público" esconde o aviso da Steam (CA8)', async () => {
    await render({ load: () => Promise.resolve(homeData({ steamPublic: false })) });
    button('Já deixei público')?.click();
    await settle();
    expect(element.querySelector('app-steam-notice')).toBeNull();
  });

  it('se não salvar a Steam, avisa o erro e mantém o aviso', async () => {
    await render({
      load: () => Promise.resolve(homeData({ steamPublic: false })),
      markSteamPublic: () => Promise.reject(new Error('rede')),
    });
    button('Já deixei público')?.click();
    await settle();
    expect(error).toHaveBeenCalledWith('Não foi possível salvar. Tente de novo.');
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
});
