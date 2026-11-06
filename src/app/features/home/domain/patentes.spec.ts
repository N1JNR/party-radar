import { PATENTES, patenteById, patenteFor, progressFor, remainingLabel } from './patentes';

describe('PATENTES', () => {
  it('segue a tabela de metas da spec 005 (CA4)', () => {
    expect(PATENTES.map((p) => [p.id, p.name, p.minHours])).toEqual([
      ['npc', 'NPC', 0],
      ['recruta', 'Recruta da fila', 5],
      ['soldado', 'Soldado do fim de semana', 15],
      ['veterano', 'Veterano de lobby', 40],
      ['lenda', 'Lenda', 120],
      ['sem-vida-social', 'Sem vida social', 200],
    ]);
  });

  it('usa os textos aprovados e não fala em amigos (CA4)', () => {
    expect(PATENTES.map((p) => [p.goal, p.pace])).toEqual([
      ['Início da temporada', null],
      ['5h', 'cerca de 35 min por semana'],
      ['15h', 'cerca de 2h por semana'],
      ['40h', 'cerca de 5h por semana'],
      ['120h', 'cerca de 2h por dia'],
      ['200h', 'cerca de 3h20 por dia'],
    ]);
    expect(JSON.stringify(PATENTES)).not.toContain('amigo');
  });
});

describe('patenteFor', () => {
  it.each([
    [0, 'npc'],
    [4.9, 'npc'],
    [5, 'recruta'],
    [14.9, 'recruta'],
    [15, 'soldado'],
    [39.9, 'soldado'],
    [40, 'veterano'],
    [119.9, 'veterano'],
    [120, 'lenda'],
    [199.9, 'lenda'],
    [200, 'sem-vida-social'],
    [5000, 'sem-vida-social'],
  ])('%sh vira %s (CA4)', (hours, id) => {
    expect(patenteFor(hours).id).toBe(id);
  });

  it('trata valores negativos ou inválidos como zero', () => {
    expect(patenteFor(-5).id).toBe('npc');
    expect(patenteFor(Number.NaN).id).toBe('npc');
    expect(patenteFor(Number.POSITIVE_INFINITY).id).toBe('npc');
  });
});

describe('patenteById', () => {
  it('acha a patente de um troféu (CA12)', () => {
    expect(patenteById('veterano').name).toBe('Veterano de lobby');
  });

  it('id desconhecido vira NPC, sem quebrar a tela', () => {
    expect(patenteById('patente-de-um-banco-mais-novo').id).toBe('npc');
  });
});

describe('progressFor', () => {
  it('no começo da temporada faltam 5h para Recruta da fila (CA2)', () => {
    expect(progressFor(0)).toEqual({
      current: PATENTES[0],
      next: PATENTES[1],
      hoursRemaining: 5,
      percent: 0,
    });
  });

  it('com 42h mostra quanto falta para Lenda (CA4)', () => {
    expect(progressFor(42)).toMatchObject({ hoursRemaining: 78, percent: 2 });
    expect(progressFor(42).current.id).toBe('veterano');
    expect(progressFor(42).next?.id).toBe('lenda');
  });

  it('arredonda as horas que faltam para cima', () => {
    expect(progressFor(4.5).hoursRemaining).toBe(1);
  });

  it('valor inválido conta como zero', () => {
    expect(progressFor(-3).hoursRemaining).toBe(5);
  });

  it('na última patente não há próxima e o progresso é 100%', () => {
    expect(progressFor(300)).toMatchObject({ next: null, hoursRemaining: 0, percent: 100 });
  });
});

describe('remainingLabel', () => {
  it('diz o que falta, no plural (CA4)', () => {
    expect(remainingLabel(progressFor(42))).toBe('Faltam 78h para Lenda.');
  });

  it('e no singular', () => {
    expect(remainingLabel(progressFor(4))).toBe('Falta 1h para Recruta da fila.');
  });

  it('fica vazio na última patente', () => {
    expect(remainingLabel(progressFor(200))).toBe('');
  });
});
