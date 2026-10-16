import { FriendPresence } from './friend-presence';
import { Squad, playingCount, squadOpportunities } from './squad-opportunity';

const friend = (id: string, game: string): FriendPresence => ({
  id,
  name: id,
  avatarUrl: null,
  game,
  platform: 'pc',
  startedAt: '2026-10-16T21:00:00Z',
});

const sexta: Squad = {
  id: 's1',
  name: 'Squad da Sexta',
  memberIds: ['ana', 'bia', 'caio', 'duda'],
};
const souls: Squad = { id: 's2', name: 'Almas Sofridas', memberIds: ['ana', 'enzo'] };

describe('squadOpportunities', () => {
  it('acha 2+ do mesmo squad no mesmo jogo (CA12)', () => {
    const result = squadOpportunities(
      [sexta],
      [friend('ana', 'Fortnite'), friend('bia', 'Fortnite'), friend('caio', 'Fortnite')],
    );
    expect(result).toHaveLength(1);
    expect(result[0].squad).toBe(sexta);
    expect(result[0].game).toBe('Fortnite');
    expect(result[0].members.map((m) => m.id)).toEqual(['ana', 'bia', 'caio']);
  });

  it('um só no jogo não é oportunidade', () => {
    expect(squadOpportunities([sexta], [friend('ana', 'Fortnite'), friend('bia', 'CS2')])).toEqual(
      [],
    );
  });

  it('ignora quem não é do squad', () => {
    expect(squadOpportunities([sexta], [friend('ana', 'CS2'), friend('enzo', 'CS2')])).toEqual([]);
  });

  it('compara o jogo sem diferenciar maiúsculas e espaços', () => {
    const result = squadOpportunities(
      [sexta],
      [friend('ana', ' fortnite'), friend('bia', 'Fortnite ')],
    );
    expect(result).toHaveLength(1);
    expect(result[0].game).toBe('fortnite');
  });

  it('ignora jogo vazio', () => {
    expect(squadOpportunities([sexta], [friend('ana', ' '), friend('bia', '')])).toEqual([]);
  });

  it('ordena por quantidade de gente e, no empate, pelo nome do squad', () => {
    const playing = [
      friend('ana', 'Elden Ring'),
      friend('enzo', 'Elden Ring'),
      friend('bia', 'CS2'),
      friend('caio', 'CS2'),
      friend('duda', 'CS2'),
    ];
    const result = squadOpportunities([sexta, souls], playing);
    expect(result.map((o) => `${o.squad.name}:${o.game}`)).toEqual([
      'Squad da Sexta:CS2',
      'Almas Sofridas:Elden Ring',
    ]);

    const tie = squadOpportunities(
      [sexta, souls],
      [friend('ana', 'Elden Ring'), friend('enzo', 'Elden Ring'), friend('bia', 'Elden Ring')],
    );
    expect(tie.map((o) => o.squad.name)).toEqual(['Almas Sofridas', 'Squad da Sexta']);
    expect(tie[0].members).toHaveLength(2);
  });

  it('respeita um mínimo diferente de membros', () => {
    expect(squadOpportunities([sexta], [friend('ana', 'CS2'), friend('bia', 'CS2')], 3)).toEqual(
      [],
    );
  });

  it('sem squads ou sem ninguém jogando, não há oportunidades', () => {
    expect(squadOpportunities([], [friend('ana', 'CS2')])).toEqual([]);
    expect(squadOpportunities([sexta], [])).toEqual([]);
  });
});

describe('playingCount', () => {
  it('conta os membros do squad jogando qualquer jogo', () => {
    expect(
      playingCount(sexta, [friend('ana', 'CS2'), friend('bia', 'Fortnite'), friend('enzo', 'CS2')]),
    ).toBe(2);
    expect(playingCount(souls, [])).toBe(0);
  });
});
