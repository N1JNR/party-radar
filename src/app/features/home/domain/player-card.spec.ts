import {
  ESTIMATE_NOTE,
  FIRST_ACCESS_PHRASES,
  PlayerCard,
  STALE_AFTER_MS,
  formatHours,
  gamesLabel,
  isFirstAccess,
  matchesLabel,
  platformShares,
  playingLabel,
  steamNameLabel,
  updatedAgoLabel,
} from './player-card';

const card = (hours: number, games: number): PlayerCard => ({
  name: 'Jorge',
  username: 'jorge',
  avatarUrl: null,
  playingNow: null,
  title: null,
  stats: { hours, hoursWithFriends: 0, distinctFriends: 0 },
  monthHours: hours,
  estimate: false,
  steamName: null,
  updatedAt: null,
  games,
  gameOfMonth: null,
  partner: null,
  platforms: [],
});

describe('isFirstAccess', () => {
  it('é primeiro acesso sem horas e sem jogos (CA7)', () => {
    expect(isFirstAccess(card(0, 0))).toBe(true);
  });

  it('não é primeiro acesso com horas ou com jogos', () => {
    expect(isFirstAccess(card(0.5, 0))).toBe(false);
    expect(isFirstAccess(card(0, 1))).toBe(false);
  });

  it('trata valores inválidos como zero', () => {
    expect(isFirstAccess(card(Number.NaN, -1))).toBe(true);
  });

  it('olha o mês: horas antigas da patente não tiram o primeiro acesso (spec 003, CA12)', () => {
    expect(isFirstAccess({ ...card(0, 0), stats: { ...card(0, 0).stats, hours: 120 } })).toBe(true);
  });
});

describe('steamNameLabel (spec 003, CA21)', () => {
  it('mostra o nome público da Steam', () => {
    expect(steamNameLabel('N1JNR')).toBe('N1JNR na Steam');
    expect(steamNameLabel('  N1JNR ')).toBe('N1JNR na Steam');
  });

  it('sem nome lido, a linha não aparece', () => {
    expect(steamNameLabel(null)).toBeNull();
    expect(steamNameLabel('   ')).toBeNull();
  });
});

describe('updatedAgoLabel (spec 003, CA15)', () => {
  const now = new Date('2026-10-26T15:00:00Z');
  const hoursAgo = (hours: number) => new Date(now.getTime() - hours * 3_600_000).toISOString();

  it('leitura recente (até 26h): não mostra nada', () => {
    expect(updatedAgoLabel(hoursAgo(1), now)).toBeNull();
    expect(updatedAgoLabel(new Date(now.getTime() - STALE_AFTER_MS).toISOString(), now)).toBeNull();
  });

  it('leitura velha: em horas até 2 dias, depois em dias', () => {
    expect(updatedAgoLabel(hoursAgo(27), now)).toBe('Atualizado há 27h');
    expect(updatedAgoLabel(hoursAgo(47.9), now)).toBe('Atualizado há 47h');
    expect(updatedAgoLabel(hoursAgo(48), now)).toBe('Atualizado há 2 dias');
    expect(updatedAgoLabel(hoursAgo(24 * 5 + 3), now)).toBe('Atualizado há 5 dias');
  });

  it('sem data ou com data inválida: não mostra nada', () => {
    expect(updatedAgoLabel(null, now)).toBeNull();
    expect(updatedAgoLabel('ontem', now)).toBeNull();
  });
});

describe('ESTIMATE_NOTE', () => {
  it('explica que o primeiro mês é estimativa (decisão da spec 003)', () => {
    expect(ESTIMATE_NOTE).toBe('Primeiro mês: estimativa a partir das últimas 2 semanas da Steam.');
  });
});

describe('FIRST_ACCESS_PHRASES', () => {
  it('tem frases para horas, jogo do mês, parceiro e plataforma', () => {
    expect(FIRST_ACCESS_PHRASES.hours).toBe('Até a geladeira tem mais tempo de tela que você.');
    expect(FIRST_ACCESS_PHRASES.partner).toBe('Nem o bot quer duo.');
    expect(FIRST_ACCESS_PHRASES.platform).toBe('Plataforma: um mistério.');
    expect(FIRST_ACCESS_PHRASES.gameOfMonth).toBeTruthy();
  });
});

describe('platformShares', () => {
  it('divide em porcentagens da maior para a menor (CA4)', () => {
    expect(
      platformShares([
        { platform: 'ps5', hours: 12 },
        { platform: 'pc', hours: 28 },
      ]),
    ).toEqual([
      { platform: 'pc', label: 'PC', percent: 70 },
      { platform: 'ps5', label: 'PS5', percent: 30 },
    ]);
  });

  it('a soma é sempre 100, mesmo com dízimas', () => {
    const shares = platformShares([
      { platform: 'pc', hours: 1 },
      { platform: 'xbox', hours: 1 },
      { platform: 'switch', hours: 1 },
    ]);
    expect(shares.reduce((sum, s) => sum + s.percent, 0)).toBe(100);
    expect(shares.map((s) => s.percent)).toEqual([34, 33, 33]);
  });

  it('uma plataforma só fica com 100%', () => {
    expect(platformShares([{ platform: 'mobile', hours: 3 }])).toEqual([
      { platform: 'mobile', label: 'Celular', percent: 100 },
    ]);
  });

  it('ignora plataformas sem horas ou com valores inválidos', () => {
    expect(
      platformShares([
        { platform: 'pc', hours: 10 },
        { platform: 'ps5', hours: 0 },
        { platform: 'xbox', hours: -2 },
        { platform: 'switch', hours: Number.NaN },
      ]),
    ).toEqual([{ platform: 'pc', label: 'PC', percent: 100 }]);
  });

  it('sem horas não há divisão', () => {
    expect(platformShares([])).toEqual([]);
    expect(platformShares([{ platform: 'pc', hours: 0 }])).toEqual([]);
  });
});

describe('formatHours', () => {
  it.each([
    [0, '0h'],
    [0.75, '45min'],
    [1, '1h'],
    [1.5, '1h30'],
    [2.1, '2h06'],
    [9.99, '9h59'],
    [10.5, '10h'],
    [42, '42h'],
    [-3, '0h'],
    [Number.NaN, '0h'],
  ])('%s vira %s', (hours, text) => {
    expect(formatHours(hours)).toBe(text);
  });
});

describe('rótulos', () => {
  it('gamesLabel usa singular e plural', () => {
    expect(gamesLabel(1)).toBe('1 jogo');
    expect(gamesLabel(7)).toBe('7 jogos');
    expect(gamesLabel(0)).toBe('0 jogos');
    expect(gamesLabel(-2)).toBe('0 jogos');
  });

  it('matchesLabel usa singular e plural', () => {
    expect(matchesLabel(1)).toBe('1 partida juntos');
    expect(matchesLabel(18)).toBe('18 partidas juntos');
    expect(matchesLabel(-1)).toBe('0 partidas juntos');
  });

  it('playingLabel diz o jogo, ou nada quando não está jogando (CA5)', () => {
    expect(playingLabel('Elden Ring')).toBe('Jogando Elden Ring agora');
    expect(playingLabel(null)).toBeNull();
    expect(playingLabel('')).toBeNull();
  });
});
