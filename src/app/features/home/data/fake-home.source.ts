import { DOCUMENT, Injectable, InjectionToken, inject } from '@angular/core';

import { AuthStore } from '../../../core/auth/auth.store';
import { environment } from '../../../../environments/environment';
import { FriendPresence } from '../domain/friend-presence';
import { PlayerCard } from '../domain/player-card';
import { HomeData, HomeDataSource } from './home.source';

/**
 * Home simulada da spec 002. Não fala com nenhum servidor.
 * Em desenvolvimento, `?simular=` na URL escolhe o cenário, para revisar cada estado da tela.
 */
export type FakeHomeScenario =
  'full' | 'first-access' | 'steam-private' | 'no-friends-playing' | 'no-squads' | 'slow' | 'error';

const SCENARIO_BY_PARAM: Record<string, FakeHomeScenario> = {
  'primeiro-acesso': 'first-access',
  'steam-privada': 'steam-private',
  'sem-amigos': 'no-friends-playing',
  'sem-squads': 'no-squads',
  carregando: 'slow',
  erro: 'error',
};

/** Cenário a partir da query string. Em produção é sempre `full`. */
export function fakeHomeScenarioFrom(search: string, production: boolean): FakeHomeScenario {
  if (production) {
    return 'full';
  }
  const param = new URLSearchParams(search).get('simular') ?? '';
  return SCENARIO_BY_PARAM[param] ?? 'full';
}

export interface FakeHomeOptions {
  scenario: FakeHomeScenario;
  /** Tempo normal de carregamento, para o esqueleto aparecer (CA14). */
  loadDelayMs: number;
  /** Tempo de carregamento no cenário `slow`. */
  slowDelayMs: number;
  /** Tempo de resposta das ações (parceria, Steam). */
  actionDelayMs: number;
  now: () => Date;
}

export const FAKE_HOME_OPTIONS = new InjectionToken<FakeHomeOptions>('FAKE_HOME_OPTIONS', {
  providedIn: 'root',
  factory: () => ({
    scenario: fakeHomeScenarioFrom(
      inject(DOCUMENT).defaultView?.location.search ?? '',
      environment.production,
    ),
    loadDelayMs: 500,
    slowDelayMs: 3000,
    actionDelayMs: 300,
    now: () => new Date(),
  }),
});

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function minutesAgo(now: Date, minutes: number): string {
  return new Date(now.getTime() - minutes * 60_000).toISOString();
}

/** Ontem, no horário local, às `hours`:`minutes`. */
function yesterdayAt(now: Date, hours: number, minutes: number): string {
  const date = new Date(now);
  date.setDate(date.getDate() - 1);
  date.setHours(hours, minutes, 0, 0);
  return date.toISOString();
}

@Injectable()
export class FakeHomeSource implements HomeDataSource {
  private readonly options = inject(FAKE_HOME_OPTIONS);
  private readonly auth = inject(AuthStore);
  private readonly document = inject(DOCUMENT);
  private failedOnce = false;

  async load(): Promise<HomeData> {
    const { scenario } = this.options;
    await wait(scenario === 'slow' ? this.options.slowDelayMs : this.options.loadDelayMs);
    // No cenário `error`, a primeira carga falha e "Tentar de novo" funciona (CA15).
    if (scenario === 'error' && !this.failedOnce) {
      this.failedOnce = true;
      throw new Error('Falha simulada ao carregar a home.');
    }
    return scenario === 'first-access' ? this.firstAccess() : this.full(scenario);
  }

  async answerPartnership(): Promise<void> {
    await wait(this.options.actionDelayMs);
  }

  private identity(): Pick<PlayerCard, 'name' | 'username' | 'avatarUrl'> {
    const user = this.auth.user();
    return {
      name: user?.name ?? 'Jogador',
      username: user?.username ?? 'jogador',
      avatarUrl: user?.avatarUrl ?? null,
    };
  }

  private inviteLink(): string {
    const origin = this.document.defaultView?.location.origin ?? '';
    return `${origin}/convite/${this.identity().username}`;
  }

  private firstAccess(): HomeData {
    return {
      card: {
        ...this.identity(),
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
      inviteLink: this.inviteLink(),
    };
  }

  private full(scenario: FakeHomeScenario): HomeData {
    const now = this.options.now();
    const friendsPlaying: FriendPresence[] = [
      {
        id: 'bia',
        name: 'Bia',
        avatarUrl: null,
        game: 'Fortnite',
        platform: 'ps5',
        startedAt: minutesAgo(now, 80),
      },
      {
        id: 'caio',
        name: 'Caio',
        avatarUrl: null,
        game: 'Fortnite',
        platform: 'pc',
        startedAt: minutesAgo(now, 25),
      },
      {
        id: 'duda',
        name: 'Duda',
        avatarUrl: null,
        game: 'Fortnite',
        platform: 'xbox',
        startedAt: minutesAgo(now, 12),
      },
      {
        id: 'rafa',
        name: 'Rafa',
        avatarUrl: null,
        game: 'CS2',
        platform: 'pc',
        startedAt: minutesAgo(now, 40),
      },
    ];
    return {
      card: {
        ...this.identity(),
        playingNow: 'Elden Ring',
        title: 'Sofredor de Souls',
        stats: { hours: 42, hoursWithFriends: 11, distinctFriends: 3 },
        games: 7,
        gameOfMonth: { name: 'Elden Ring', hours: 18 },
        partner: { id: 'rafa', name: 'Rafa', avatarUrl: null, matches: 18, probable: true },
        platforms: [
          { platform: 'pc', hours: 28 },
          { platform: 'ps5', hours: 12 },
        ],
      },
      steamPublic: scenario !== 'steam-private',
      friendsCount: 6,
      friendsPlaying: scenario === 'no-friends-playing' ? [] : friendsPlaying,
      squads:
        scenario === 'no-squads'
          ? []
          : [
              { id: 'sexta', name: 'Squad da Sexta', memberIds: ['bia', 'caio', 'duda', 'rafa'] },
              { id: 'almas', name: 'Almas Sofridas', memberIds: ['rafa', 'enzo'] },
            ],
      question: {
        id: 'cs2-ontem',
        friendId: 'rafa',
        friendName: 'Rafa',
        game: 'CS2',
        startedAt: yesterdayAt(now, 22, 0),
        endedAt: yesterdayAt(now, 23, 40),
      },
      inviteLink: this.inviteLink(),
    };
  }
}
