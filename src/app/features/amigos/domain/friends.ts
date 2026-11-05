/** Uma pessoa no Party Radar: só o que amigos podem ver (spec 006). */
export interface Player {
  id: string;
  name: string;
  username: string;
  avatarUrl: string | null;
}

/** Um amigo, com o jogo aberto agora. */
export interface Friend extends Player {
  playing: string | null;
}

/** A relação de quem está logado com outra pessoa. */
export type Relation = 'self' | 'friend' | 'sent' | 'received' | 'blocked' | 'none';

/** Quem foi achado pelo @usuário. */
export interface FoundPlayer extends Player {
  relation: Relation;
}

export interface FriendsData {
  friends: Friend[];
  received: Player[];
  sent: Player[];
  blocked: Player[];
}

/** O que aconteceu ao pedir amizade. */
export type SendResult =
  | 'sent'
  | 'friends'
  | 'already_friends'
  | 'already_sent'
  | 'limit'
  | 'not_found'
  | 'self'
  | 'blocked';

/** A mesma frase para quem não existe e para quem me bloqueou (CA4). */
export const NOT_FOUND_MESSAGE = 'Não encontramos esse @usuário.';

/** Amigos jogando primeiro e, dentro de cada grupo, em ordem de nome (CA12). */
export function sortFriends(friends: readonly Friend[]): Friend[] {
  return [...friends].sort(
    (a, b) =>
      Number(b.playing !== null) - Number(a.playing !== null) ||
      a.name.localeCompare(b.name, 'pt-BR'),
  );
}

/** Em ordem de nome, para a lista não mudar de lugar a cada releitura. */
export function sortPlayers<T extends Player>(players: readonly T[]): T[] {
  return [...players].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
}

/** Tira espaços, o @ da frente e as maiúsculas do que foi digitado (CA3). */
export function cleanUsername(text: string): string {
  return text.trim().replace(/^@+/, '').toLowerCase();
}

/** Mesma regra do banco para o @usuário: sem isso, nem vale perguntar ao servidor. */
export function isUsername(text: string): boolean {
  return /^[a-z0-9_]{3,20}$/.test(text);
}

/** O aviso depois de pedir amizade; `success` diz se algo novo aconteceu (CA3 a CA7, CA11). */
export function sendMessage(result: SendResult, name: string): { success: boolean; text: string } {
  switch (result) {
    case 'sent':
      return { success: true, text: `Pedido enviado para ${name}.` };
    case 'friends':
      return { success: true, text: `Agora você e ${name} são amigos.` };
    case 'already_friends':
      return { success: false, text: `Você e ${name} já são amigos.` };
    case 'already_sent':
      return { success: false, text: `Você já pediu amizade a ${name}.` };
    case 'limit':
      return {
        success: false,
        text: 'Você já tem 20 pedidos abertos. Espere uma resposta ou cancele algum.',
      };
    case 'self':
      return { success: false, text: 'Esse é o seu @usuário.' };
    case 'blocked':
      return { success: false, text: `Você bloqueou ${name}. Desbloqueie para pedir amizade.` };
    default:
      return { success: false, text: NOT_FOUND_MESSAGE };
  }
}

/** O estado de quem foi achado, em texto (CA6, CA21); `null` quando ainda dá para pedir. */
export function relationLabel(relation: Relation): string | null {
  switch (relation) {
    case 'self':
      return 'Esse é o seu @usuário.';
    case 'friend':
      return 'Vocês já são amigos.';
    case 'sent':
      return 'Pedido enviado.';
    case 'received':
      return 'Esta pessoa pediu sua amizade.';
    case 'blocked':
      return 'Você bloqueou esta pessoa.';
    default:
      return null;
  }
}
