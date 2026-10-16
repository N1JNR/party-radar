import { FriendPresence } from './friend-presence';

export interface Squad {
  id: string;
  name: string;
  /** Ids dos amigos que fazem parte do squad (sem contar a própria pessoa). */
  memberIds: readonly string[];
}

/** Dois ou mais de um squad no mesmo jogo agora (CA12). */
export interface SquadOpportunity {
  squad: Squad;
  game: string;
  members: FriendPresence[];
}

const normalize = (game: string) => game.trim().toLocaleLowerCase('pt-BR');

/**
 * As oportunidades de squad: para cada squad, os jogos com pelo menos `minMembers` membros
 * jogando. O nome do jogo é comparado sem diferenciar maiúsculas e espaços nas pontas. Vem
 * primeiro quem tem mais gente; no empate, o nome do squad.
 */
export function squadOpportunities(
  squads: readonly Squad[],
  playing: readonly FriendPresence[],
  minMembers = 2,
): SquadOpportunity[] {
  const opportunities: SquadOpportunity[] = [];
  for (const squad of squads) {
    const byGame = new Map<string, FriendPresence[]>();
    for (const friend of playing) {
      if (!squad.memberIds.includes(friend.id) || !friend.game.trim()) {
        continue;
      }
      const key = normalize(friend.game);
      byGame.set(key, [...(byGame.get(key) ?? []), friend]);
    }
    for (const members of byGame.values()) {
      if (members.length >= minMembers) {
        opportunities.push({ squad, game: members[0].game.trim(), members });
      }
    }
  }
  return opportunities.sort(
    (a, b) =>
      b.members.length - a.members.length || a.squad.name.localeCompare(b.squad.name, 'pt-BR'),
  );
}

/** Quantos membros do squad estão jogando agora, em qualquer jogo (badge do menu). */
export function playingCount(squad: Squad, playing: readonly FriendPresence[]): number {
  return playing.filter((friend) => squad.memberIds.includes(friend.id)).length;
}
