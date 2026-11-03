import {
  GameKind,
  KindShare,
  MAX_BLOCKS,
  PlayedGame,
  RADAR_AXES,
  RADAR_CENTER,
  RADAR_RADIUS,
  VERSATILE_TITLE,
  blockRows,
  gameBlocks,
  gameCount,
  gamesIn,
  kindShares,
  monthLabel,
  playerTitle,
  previousMonthHours,
  radarAxes,
  radarDescription,
  radarPolygon,
  topGame,
  totalHours,
} from './player-radar';

function game(
  appId: number,
  kind: GameKind,
  totalHours: number,
  monthHours = 0,
  previousMonthHours = 0,
): PlayedGame {
  return { appId, name: `Jogo ${appId}`, kind, totalHours, monthHours, previousMonthHours };
}

// A biblioteca do Jorge na conferência da spec 003 (horas arredondadas).
const library: PlayedGame[] = [
  game(1, 'tiro', 313, 15, 44),
  game(2, 'tiro', 304, 0, 0),
  game(3, 'esporte', 109, 0, 2),
  game(4, 'tiro', 16),
  game(5, 'aventura', 14),
  game(6, 'rpg', 11),
  game(7, 'aventura', 8),
  game(8, 'tiro', 6),
  game(9, 'tiro', 5),
  game(10, 'outros', 1),
  game(11, 'outros', 1),
];

const percentOf = (shares: readonly KindShare[], kind: GameKind) =>
  shares.find((share) => share.kind === kind)?.percent;

describe('gamesIn, totalHours e gameCount', () => {
  it('só os jogos com tempo no período, do mais jogado ao menos (CA9)', () => {
    expect(gamesIn(library, 'all').map((g) => g.appId)[0]).toBe(1);
    expect(gamesIn(library, 'month').map((g) => g.appId)).toEqual([1]);
    expect(gameCount(library, 'all')).toBe(11);
    expect(gameCount(library, 'month')).toBe(1);
    expect(totalHours(library, 'all')).toBe(788);
    expect(totalHours(library, 'month')).toBe(15);
  });

  it('não muda a ordem da lista original e ignora horas inválidas', () => {
    const invalid = [game(1, 'tiro', 5), game(2, 'tiro', Number.NaN), game(3, 'tiro', -3)];
    expect(gameCount(invalid, 'all')).toBe(1);
    expect(totalHours(invalid, 'all')).toBe(5);
    expect(invalid[1].appId).toBe(2);
  });
});

describe('kindShares', () => {
  it('porcentagens reais, que somam 100 contando "Outros" (CA2)', () => {
    const shares = kindShares(library, 'all');
    expect(percentOf(shares, 'tiro')).toBe(82);
    expect(percentOf(shares, 'esporte')).toBe(14);
    expect(percentOf(shares, 'aventura')).toBe(3);
    expect(percentOf(shares, 'rpg')).toBe(1);
    expect(percentOf(shares, 'corrida')).toBe(0);
    expect(shares.reduce((sum, share) => sum + share.percent, 0)).toBe(100);
    expect(shares.at(-1)?.kind).toBe('outros');
  });

  it('muda com o período (CA3)', () => {
    const shares = kindShares(library, 'month');
    expect(percentOf(shares, 'tiro')).toBe(100);
    expect(percentOf(shares, 'esporte')).toBe(0);
  });

  it('terços fecham em 100, com o maior resto para o primeiro', () => {
    const shares = kindShares([game(1, 'tiro', 1), game(2, 'rpg', 1), game(3, 'arcade', 1)], 'all');
    expect(shares.reduce((sum, share) => sum + share.percent, 0)).toBe(100);
    expect(percentOf(shares, 'tiro')).toBe(34);
  });

  it('sem horas, tudo em zero', () => {
    const shares = kindShares([], 'all');
    expect(shares.every((share) => share.percent === 0 && share.hours === 0)).toBe(true);
  });
});

describe('playerTitle', () => {
  const titleOf = (games: PlayedGame[]) => playerTitle(kindShares(games, 'all'));

  it('o título vem do tipo com 40% ou mais (CA5)', () => {
    expect(titleOf(library)).toBe('Atirador nato');
    expect(titleOf([game(1, 'esporte', 40), game(2, 'tiro', 30), game(3, 'rpg', 30)])).toBe(
      'Craque de sofá',
    );
  });

  it.each([
    ['corrida', 'Pé no fundo'],
    ['simulacao', 'Mestre da simulação'],
    ['arcade', 'Rei do fliperama'],
    ['rpg', 'Viciado em side quest'],
    ['aventura', 'Explorador sem mapa'],
  ] as const)('%s dá "%s"', (kind, title) => {
    expect(titleOf([game(1, kind, 10)])).toBe(title);
  });

  it('abaixo de 40%, "Jogador versátil" (CA5)', () => {
    expect(
      titleOf([
        game(1, 'tiro', 30),
        game(2, 'rpg', 30),
        game(3, 'arcade', 20),
        game(4, 'corrida', 20),
      ]),
    ).toBe(VERSATILE_TITLE);
  });

  it('empate: vale o tipo que vem primeiro na tabela (CA5)', () => {
    expect(titleOf([game(1, 'aventura', 50), game(2, 'rpg', 50)])).toBe('Viciado em side quest');
  });

  it('"Outros" não dá título', () => {
    expect(titleOf([game(1, 'outros', 100)])).toBe(VERSATILE_TITLE);
  });

  it('lista parcial: tipo que não veio conta como zero', () => {
    expect(playerTitle([{ kind: 'outros', label: 'Outros', hours: 5, percent: 100 }])).toBe(
      VERSATILE_TITLE,
    );
  });

  it('sem horas, sem título (CA18, CA19)', () => {
    expect(titleOf([])).toBeNull();
  });
});

describe('radarAxes e radarPolygon', () => {
  const axes = radarAxes(kindShares(library, 'all'));
  const distance = (axis: { px: number; py: number }) =>
    Math.hypot(axis.px - RADAR_CENTER, axis.py - RADAR_CENTER);

  it('um eixo para cada um dos 7 tipos, começando em cima (CA1)', () => {
    expect(axes.map((axis) => axis.kind)).toEqual([...RADAR_AXES]);
    expect(axes[0].x).toBe(RADAR_CENTER);
    expect(axes[0].y).toBe(RADAR_CENTER - RADAR_RADIUS);
    expect(axes[0].label).toBe('Tiro');
  });

  it('a forma cresce com a porcentagem e tipo sem horas fica perto do centro', () => {
    const tiro = axes.find((axis) => axis.kind === 'tiro')!;
    const esporte = axes.find((axis) => axis.kind === 'esporte')!;
    const corrida = axes.find((axis) => axis.kind === 'corrida')!;
    expect(distance(tiro)).toBeGreaterThan(distance(esporte));
    expect(distance(esporte)).toBeGreaterThan(distance(corrida));
    expect(distance(corrida)).toBeCloseTo(RADAR_RADIUS * 0.05, 0);
  });

  it('tipos pequenos ficam visíveis, e o número mostrado continua o real (CA2)', () => {
    const rpg = axes.find((axis) => axis.kind === 'rpg')!;
    expect(rpg.percent).toBe(1);
    expect(distance(rpg)).toBeGreaterThan(RADAR_RADIUS * 0.1);
  });

  it('tipo ausente da lista conta como zero', () => {
    const empty = radarAxes([]);
    expect(empty.every((axis) => axis.percent === 0)).toBe(true);
  });

  it('o polígono tem um ponto por eixo', () => {
    expect(radarPolygon(axes).split(' ')).toHaveLength(RADAR_AXES.length);
    expect(radarPolygon(axes).split(' ')[0]).toBe(`${axes[0].px},${axes[0].py}`);
  });
});

describe('radarDescription', () => {
  it('descreve as porcentagens para o leitor de tela (CA23)', () => {
    expect(radarDescription(kindShares(library, 'all'))).toBe(
      'Radar do jogador: 82% Tiro, 14% Esporte, 3% Aventura, 1% RPG.',
    );
  });

  it('sem horas', () => {
    expect(radarDescription(kindShares([], 'all'))).toBe('Radar do jogador sem horas.');
  });
});

describe('gameBlocks e blockRows', () => {
  it('os 7 mais jogados e o resto somado (CA10)', () => {
    const blocks = gameBlocks(library, 'all');
    expect(blocks).toHaveLength(MAX_BLOCKS + 1);
    expect(blocks[0]).toEqual({ id: '1', name: 'Jogo 1', hours: 313, kind: 'tiro' });
    expect(blocks.at(-1)).toEqual({ id: 'outros', name: 'Outros 4 jogos', hours: 13, kind: null });
  });

  it('um jogo a mais fica como "Outro jogo"', () => {
    const eight = Array.from({ length: 8 }, (_, i) => game(i + 1, 'tiro', 10 - i));
    expect(gameBlocks(eight, 'all').at(-1)?.name).toBe('Outro jogo');
  });

  it('até 7 jogos, sem bloco somado', () => {
    expect(gameBlocks(library, 'month')).toEqual([
      { id: '1', name: 'Jogo 1', hours: 15, kind: 'tiro' },
    ]);
  });

  it('duas linhas: os 2 maiores em cima e o resto embaixo', () => {
    const rows = blockRows(gameBlocks(library, 'all'));
    expect(rows.map((row) => row.length)).toEqual([2, 6]);
  });

  it('com poucos blocos, sem linha vazia', () => {
    expect(blockRows(gameBlocks(library, 'month')).map((row) => row.length)).toEqual([1]);
    expect(blockRows([])).toEqual([]);
  });
});

describe('previousMonthHours e topGame', () => {
  it('soma o mês anterior, ignorando valores inválidos (CA11)', () => {
    expect(previousMonthHours(library)).toBe(46);
    expect(previousMonthHours([game(1, 'tiro', 1, 0, Number.NaN), game(2, 'tiro', 1, 0, -2)])).toBe(
      0,
    );
  });

  it('o jogo mais jogado desde sempre (CA14)', () => {
    expect(topGame(library)?.appId).toBe(1);
    expect(topGame([])).toBeNull();
  });
});

describe('monthLabel', () => {
  it('nome do mês em português, com inicial maiúscula (CA11)', () => {
    expect(monthLabel(new Date('2026-11-15T12:00:00Z'))).toBe('Novembro');
  });

  it('segue o fuso de São Paulo na virada do mês', () => {
    expect(monthLabel(new Date('2026-11-01T02:00:00Z'))).toBe('Outubro');
    expect(monthLabel(new Date('2026-11-01T04:00:00Z'))).toBe('Novembro');
  });

  it('mês anterior, inclusive na virada do ano', () => {
    expect(monthLabel(new Date('2026-11-15T12:00:00Z'), -1)).toBe('Outubro');
    expect(monthLabel(new Date('2027-01-15T12:00:00Z'), -1)).toBe('Dezembro');
  });
});
