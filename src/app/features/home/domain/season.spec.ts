import {
  SeasonProgress,
  SeasonTrophy,
  careerLabel,
  seasonHoursLabel,
  seasonImage,
  seasonImageStatus,
  seasonLabel,
  sortTrophies,
  trophyDetail,
  trophyImage,
  trophyLabel,
} from './season';

const season = (daysLeft: number): SeasonProgress => ({
  number: 1,
  daysLeft,
  hours: 42,
  topGame: 'ARC Raiders',
});

const trophy = (fields: Partial<SeasonTrophy> = {}): SeasonTrophy => ({
  season: 1,
  rankId: 'veterano',
  hours: 46,
  topGame: 'Elden Ring',
  ...fields,
});

describe('seasonLabel (CA1)', () => {
  it('diz quantos dias faltam', () => {
    expect(seasonLabel(season(52))).toBe('Temporada 1: faltam 52 dias.');
  });

  it('usa o singular quando falta 1 dia', () => {
    expect(seasonLabel(season(1))).toBe('Temporada 1: falta 1 dia.');
  });

  it('avisa o último dia', () => {
    expect(seasonLabel(season(0))).toBe('Temporada 1: último dia.');
  });

  it('valor negativo conta como último dia', () => {
    expect(seasonLabel(season(-2))).toBe('Temporada 1: último dia.');
  });
});

describe('seasonHoursLabel (CA4)', () => {
  it('deixa claro de onde vêm as horas', () => {
    expect(seasonHoursLabel(42)).toBe('42h nesta temporada, somando todos os seus jogos.');
  });

  it('sem horas, diz que ainda não há', () => {
    expect(seasonHoursLabel(0)).toBe('Nenhuma hora nesta temporada ainda.');
  });
});

describe('careerLabel (CA14)', () => {
  it('mostra as horas totais na Steam', () => {
    expect(careerLabel(788)).toBe('Carreira: 788h na Steam.');
  });
});

describe('trophyLabel e trophyDetail (CA10, CA12)', () => {
  it('nomeia a temporada e a patente', () => {
    expect(trophyLabel(trophy())).toBe('Temporada 1: Veterano de lobby');
  });

  it('mostra as horas e o jogo principal', () => {
    expect(trophyDetail(trophy())).toBe('46h, mais em Elden Ring');
  });

  it('sem jogo conhecido, só as horas', () => {
    expect(trophyDetail(trophy({ topGame: null }))).toBe('46h');
  });
});

describe('seasonImage e trophyImage (CA13)', () => {
  it('a temporada em andamento leva a patente pelas horas', () => {
    expect(seasonImage('ana', season(52))).toEqual({
      username: 'ana',
      season: 1,
      rankId: 'veterano',
      hours: 42,
      topGame: 'ARC Raiders',
      daysLeft: 52,
    });
  });

  it('dias negativos contam como último dia', () => {
    expect(seasonImage('ana', season(-1)).daysLeft).toBe(0);
  });

  it('o troféu leva a patente gravada, sem dias restantes', () => {
    expect(trophyImage('ana', trophy({ rankId: 'lenda', hours: 46 }))).toEqual({
      username: 'ana',
      season: 1,
      rankId: 'lenda',
      hours: 46,
      topGame: 'Elden Ring',
      daysLeft: null,
    });
  });

  it('traz só o @usuário e os dados de jogo', () => {
    expect(Object.keys(seasonImage('ana', season(1))).sort()).toEqual([
      'daysLeft',
      'hours',
      'rankId',
      'season',
      'topGame',
      'username',
    ]);
  });
});

describe('seasonImageStatus (CA13)', () => {
  const image = (daysLeft: number | null) => ({ ...seasonImage('ana', season(1)), daysLeft });

  it.each([
    [52, 'Faltam 52 dias'],
    [1, 'Falta 1 dia'],
    [0, 'Último dia'],
    [null, 'Temporada encerrada'],
  ])('%s dias: %s', (days, text) => {
    expect(seasonImageStatus(image(days))).toBe(text);
  });
});

describe('sortTrophies (CA12)', () => {
  it('ordena da temporada mais recente para a mais antiga, sem mudar a lista original', () => {
    const list = [trophy({ season: 1 }), trophy({ season: 3 }), trophy({ season: 2 })];
    expect(sortTrophies(list).map((t) => t.season)).toEqual([3, 2, 1]);
    expect(list[0].season).toBe(1);
  });
});
