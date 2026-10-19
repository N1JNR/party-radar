import { PATENTES, PlayStats, patenteFor, progressFor, remainingLabel } from './patentes';

const stats = (hours: number, hoursWithFriends = 0, distinctFriends = 0): PlayStats => ({
  hours,
  hoursWithFriends,
  distinctFriends,
});

describe('PATENTES', () => {
  it('tem 6 patentes em ordem crescente de horas', () => {
    expect(PATENTES.map((p) => p.name)).toEqual([
      'NPC',
      'Recruta da fila',
      'Soldado do fim de semana',
      'Veterano de lobby',
      'Lenda do squad',
      'Sem vida social',
    ]);
    const hours = PATENTES.map((p) => p.minHours);
    expect([...hours].sort((a, b) => a - b)).toEqual(hours);
  });
});

describe('patenteFor', () => {
  it.each([
    [0, 'npc'],
    [0.5, 'npc'],
    [1, 'recruta'],
    [9.9, 'recruta'],
    [10, 'soldado'],
    [39, 'soldado'],
    [40, 'veterano'],
    [79, 'veterano'],
  ])('%sh sem amigos vira %s', (hours, id) => {
    expect(patenteFor(stats(hours)).id).toBe(id);
  });

  it('Lenda do squad exige 80h e 20h com amigos', () => {
    expect(patenteFor(stats(80, 19)).id).toBe('veterano');
    expect(patenteFor(stats(80, 20)).id).toBe('lenda');
  });

  it('Sem vida social exige 200h e 5 amigos diferentes, além de ter passado pela Lenda', () => {
    expect(patenteFor(stats(200, 20, 4)).id).toBe('lenda');
    expect(patenteFor(stats(200, 20, 5)).id).toBe('sem-vida-social');
  });

  it('não pula degraus: muitas horas sem jogar com amigos param no Veterano', () => {
    expect(patenteFor(stats(500, 0, 10)).id).toBe('veterano');
  });

  it('trata valores negativos ou inválidos como zero', () => {
    expect(patenteFor(stats(-5, -1, -2)).id).toBe('npc');
    expect(patenteFor(stats(Number.NaN, Number.POSITIVE_INFINITY, 3)).id).toBe('npc');
  });
});

describe('progressFor', () => {
  it('no primeiro acesso falta 1h para Recruta da fila (CA7)', () => {
    expect(progressFor(stats(0))).toEqual({
      current: PATENTES[0],
      next: PATENTES[1],
      hoursRemaining: 1,
      friendHoursRemaining: 0,
      friendsRemaining: 0,
      percent: 0,
    });
  });

  it('com 42h mostra quanto falta para Lenda do squad (CA4)', () => {
    const progress = progressFor(stats(42, 11, 3));
    expect(progress.current.id).toBe('veterano');
    expect(progress.next?.id).toBe('lenda');
    expect(progress.hoursRemaining).toBe(38);
    expect(progress.friendHoursRemaining).toBe(9);
    expect(progress.percent).toBe(5);
  });

  it('arredonda as horas que faltam para cima', () => {
    expect(progressFor(stats(0.4)).hoursRemaining).toBe(1);
  });

  it('com horas suficientes mas sem amigos, mostra 0h e o que falta de amigos', () => {
    const progress = progressFor(stats(120, 5));
    expect(progress.current.id).toBe('veterano');
    expect(progress.hoursRemaining).toBe(0);
    expect(progress.friendHoursRemaining).toBe(15);
    expect(progress.percent).toBe(100);
  });

  it('conta os amigos diferentes que faltam para Sem vida social', () => {
    const progress = progressFor(stats(150, 30, 2));
    expect(progress.next?.id).toBe('sem-vida-social');
    expect(progress.friendsRemaining).toBe(3);
    expect(progress.friendHoursRemaining).toBe(0);
  });

  it('na última patente não há próxima e o progresso é 100%', () => {
    expect(progressFor(stats(300, 50, 8))).toMatchObject({
      next: null,
      hoursRemaining: 0,
      friendHoursRemaining: 0,
      friendsRemaining: 0,
      percent: 100,
    });
  });
});

describe('remainingLabel', () => {
  it('no primeiro acesso: "Falta 1h para Recruta da fila." (CA7)', () => {
    expect(remainingLabel(progressFor(stats(0)))).toBe('Falta 1h para Recruta da fila.');
  });

  it('junta horas e horas com amigos (CA4)', () => {
    expect(remainingLabel(progressFor(stats(42, 11, 3)))).toBe(
      'Faltam 38h e 9h com amigos para Lenda do squad.',
    );
  });

  it('só horas com amigos', () => {
    expect(remainingLabel(progressFor(stats(120, 5)))).toBe(
      'Faltam 15h com amigos para Lenda do squad.',
    );
    expect(remainingLabel(progressFor(stats(120, 19)))).toBe(
      'Falta 1h com amigos para Lenda do squad.',
    );
  });

  it('horas e amigos diferentes, no singular e no plural', () => {
    expect(remainingLabel(progressFor(stats(150, 30, 2)))).toBe(
      'Faltam 50h e 3 amigos diferentes para Sem vida social.',
    );
    expect(remainingLabel(progressFor(stats(250, 30, 4)))).toBe(
      'Falta 1 amigo diferente para Sem vida social.',
    );
  });

  it('três partes viram lista com vírgula e "e"', () => {
    const progress = {
      ...progressFor(stats(42)),
      hoursRemaining: 2,
      friendHoursRemaining: 3,
      friendsRemaining: 2,
    };
    expect(remainingLabel(progress)).toBe(
      'Faltam 2h, 3h com amigos e 2 amigos diferentes para Lenda do squad.',
    );
  });

  it('vazio na última patente ou sem nada faltando', () => {
    expect(remainingLabel(progressFor(stats(300, 50, 8)))).toBe('');
    const nothing = { ...progressFor(stats(42)), hoursRemaining: 0, friendHoursRemaining: 0 };
    expect(remainingLabel(nothing)).toBe('');
  });
});
