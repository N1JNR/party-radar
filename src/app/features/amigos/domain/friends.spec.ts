import {
  Friend,
  NOT_FOUND_MESSAGE,
  Relation,
  SendResult,
  cleanUsername,
  isUsername,
  relationLabel,
  sendMessage,
  sortFriends,
} from './friends';

const friend = (name: string, playing: string | null = null): Friend => ({
  id: name,
  name,
  username: name.toLowerCase(),
  avatarUrl: null,
  playing,
});

describe('sortFriends (CA12)', () => {
  it('coloca quem está jogando primeiro e depois ordena por nome', () => {
    const list = [friend('Caio'), friend('Duda', 'Dota 2'), friend('Ágata'), friend('Bia', 'CS2')];
    expect(sortFriends(list).map((f) => f.name)).toEqual(['Bia', 'Duda', 'Ágata', 'Caio']);
  });

  it('não muda a lista original', () => {
    const list = [friend('Bia'), friend('Ana')];
    sortFriends(list);
    expect(list[0].name).toBe('Bia');
  });
});

describe('cleanUsername e isUsername (CA3)', () => {
  it.each([
    ['  @Bia_Jogos ', 'bia_jogos'],
    ['@@ana', 'ana'],
    ['CAIO', 'caio'],
  ])('%s vira %s', (text, clean) => {
    expect(cleanUsername(text)).toBe(clean);
  });

  it.each(['ana', 'bia_123', 'a'.repeat(20)])('%s é válido', (text) => {
    expect(isUsername(text)).toBe(true);
  });

  it.each(['', 'ab', 'a'.repeat(21), 'com espaço', 'Maiúscula', "bia' or 1=1"])(
    '"%s" não é válido',
    (text) => {
      expect(isUsername(text)).toBe(false);
    },
  );
});

describe('sendMessage', () => {
  it.each<[SendResult, boolean, string]>([
    ['sent', true, 'Pedido enviado para Bia.'],
    ['friends', true, 'Agora você e Bia são amigos.'],
    ['already_friends', false, 'Você e Bia já são amigos.'],
    ['already_sent', false, 'Você já pediu amizade a Bia.'],
    ['limit', false, 'Você já tem 20 pedidos abertos. Espere uma resposta ou cancele algum.'],
    ['self', false, 'Esse é o seu @usuário.'],
    ['blocked', false, 'Você bloqueou Bia. Desbloqueie para pedir amizade.'],
    ['not_found', false, NOT_FOUND_MESSAGE],
  ])('%s', (result, success, text) => {
    expect(sendMessage(result, 'Bia')).toEqual({ success, text });
  });
});

describe('relationLabel (CA6, CA21)', () => {
  it.each<[Relation, string | null]>([
    ['self', 'Esse é o seu @usuário.'],
    ['friend', 'Vocês já são amigos.'],
    ['sent', 'Pedido enviado.'],
    ['received', 'Esta pessoa pediu sua amizade.'],
    ['blocked', 'Você bloqueou esta pessoa.'],
    ['none', null],
  ])('%s', (relation, label) => {
    expect(relationLabel(relation)).toBe(label);
  });
});
