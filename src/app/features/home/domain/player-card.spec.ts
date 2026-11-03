import {
  ESTIMATE_NOTE,
  FIRST_ACCESS_PHRASES,
  STALE_AFTER_MS,
  formatHours,
  gamesLabel,
  playingLabel,
  steamNameLabel,
  updatedAgoLabel,
} from './player-card';

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
  it('tem a frase das horas', () => {
    expect(FIRST_ACCESS_PHRASES.hours).toBe('Até a geladeira tem mais tempo de tela que você.');
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

  it('playingLabel diz o jogo, ou nada quando não está jogando (CA5)', () => {
    expect(playingLabel('Elden Ring')).toBe('Jogando Elden Ring agora');
    expect(playingLabel(null)).toBeNull();
    expect(playingLabel('')).toBeNull();
  });
});
