import {
  AddMemberStatus,
  ChatMessage,
  Conversation,
  CreateSquadStatus,
  DELETED_TEXT,
  READ_ONLY_TEXT,
  addMemberFailureText,
  conversationsWithNews,
  createSquadFailureText,
  dayLabel,
  groupByDay,
  lastPreview,
  listTimeLabel,
  menuLabel,
  mergeMessages,
  messageError,
  sendFailureText,
  squadNameError,
  timeLabel,
  unreadLabel,
  withoutDelivered,
} from './chat';

const message = (id: string, createdAt = '2026-11-05T12:00:00Z'): ChatMessage => ({
  id,
  clientId: `c-${id}`,
  senderId: 'ana',
  senderName: 'Ana',
  senderAvatarUrl: null,
  body: id,
  createdAt,
  deleted: false,
  mine: false,
});

const conversation = (fields: Partial<Conversation> = {}): Conversation => ({
  id: '1',
  kind: 'direct',
  title: 'Bia',
  avatarUrl: null,
  isOwner: false,
  memberCount: 2,
  canSend: true,
  lastBody: 'oi',
  lastDeleted: false,
  lastSenderName: 'Bia',
  lastAt: '2026-11-05T12:00:00Z',
  unread: 0,
  ...fields,
});

const now = new Date('2026-11-05T15:00:00Z');

describe('mergeMessages (CA6, CA8)', () => {
  it('junta sem repetir e ordena da mais antiga para a mais nova', () => {
    const merged = mergeMessages(
      [message('b', '2026-11-05T12:00:00Z'), message('c', '2026-11-05T13:00:00Z')],
      [message('c', '2026-11-05T13:00:00Z'), message('a', '2026-11-05T11:00:00Z')],
    );
    expect(merged.map((m) => m.id)).toEqual(['a', 'b', 'c']);
  });

  it('a versão nova substitui a antiga, como numa mensagem apagada', () => {
    const merged = mergeMessages([message('a')], [{ ...message('a'), body: null, deleted: true }]);
    expect(merged).toHaveLength(1);
    expect(merged[0].deleted).toBe(true);
  });

  it('no mesmo horário, desempata pelo id', () => {
    expect(mergeMessages([], [message('b'), message('a')]).map((m) => m.id)).toEqual(['a', 'b']);
  });
});

describe('withoutDelivered (CA9)', () => {
  it('tira o que já voltou do servidor', () => {
    const pending = [
      { clientId: 'c-a', body: 'a', status: 'sending' as const, reason: null },
      { clientId: 'c-x', body: 'x', status: 'failed' as const, reason: 'Não enviada.' },
    ];
    expect(withoutDelivered(pending, [message('a')]).map((p) => p.clientId)).toEqual(['c-x']);
  });
});

describe('messageError (CA4)', () => {
  it.each(['', '    ', '\n\n'])('texto vazio não pode ser enviado: "%s"', (text) => {
    expect(messageError(text)).toBe('Escreva uma mensagem antes de enviar.');
  });

  it('explica o limite', () => {
    expect(messageError('a'.repeat(2001))).toContain('2000');
  });

  it('aceita até 2.000 caracteres, sem contar os espaços das pontas', () => {
    expect(messageError(`  ${'a'.repeat(2000)}  `)).toBeNull();
  });
});

describe('sendFailureText', () => {
  it.each([
    ['invalid', 'A mensagem precisa ter de 1 a 2000 caracteres.'],
    ['rate_limited', 'Muitas mensagens seguidas. Espere um instante e tente de novo.'],
    ['read_only', READ_ONLY_TEXT],
    ['not_member', READ_ONLY_TEXT],
    ['failed', 'Não enviada.'],
  ] as const)('%s', (status, text) => {
    expect(sendFailureText(status)).toBe(text);
  });
});

describe('squadNameError (CA11)', () => {
  it('pede um nome', () => {
    expect(squadNameError('   ')).toBe('Dê um nome ao squad.');
  });

  it('limita a 40 caracteres', () => {
    expect(squadNameError('a'.repeat(41))).toBe('O nome pode ter até 40 caracteres.');
  });

  it('aceita 40 caracteres', () => {
    expect(squadNameError('a'.repeat(40))).toBeNull();
  });
});

describe('createSquadFailureText (CA11, CA14, CA17)', () => {
  it.each<[Exclude<CreateSquadStatus, 'created'>, string]>([
    ['invalid_name', 'Dê ao squad um nome de 1 a 40 caracteres.'],
    ['no_members', 'Escolha pelo menos um amigo.'],
    ['full', 'Um squad pode ter até 50 pessoas.'],
    ['not_friends', 'Só seus amigos podem entrar no squad.'],
  ])('%s', (status, text) => {
    expect(createSquadFailureText(status)).toBe(text);
  });
});

describe('addMemberFailureText (CA13, CA14, CA17)', () => {
  it.each<[AddMemberStatus, string | null]>([
    ['added', null],
    ['already', 'Essa pessoa já está no squad.'],
    ['full', 'Este squad está cheio: são 50 pessoas no máximo.'],
    ['not_owner', 'Só o dono do squad pode adicionar pessoas.'],
    ['not_friends', 'Só seus amigos podem entrar no squad.'],
  ])('%s', (status, text) => {
    expect(addMemberFailureText(status)).toBe(text);
  });
});

describe('não lidas (CA18)', () => {
  it('conta as conversas com novidade', () => {
    expect(
      conversationsWithNews([
        conversation({ unread: 3 }),
        conversation(),
        conversation({ unread: 1 }),
      ]),
    ).toBe(2);
  });

  it.each([
    [0, 'Conversas'],
    [1, 'Conversas · 1 com novidade'],
    [2, 'Conversas · 2 com novidade'],
  ])('menu com %s', (count, label) => {
    expect(menuLabel(count)).toBe(label);
  });

  it('diz a quantidade em texto', () => {
    expect(unreadLabel(1)).toBe('1 não lida');
    expect(unreadLabel(12)).toBe('12 não lidas');
  });
});

describe('lastPreview (CA19)', () => {
  it('conversa a dois mostra só o texto', () => {
    expect(lastPreview(conversation())).toBe('oi');
  });

  it('squad mostra quem escreveu', () => {
    expect(lastPreview(conversation({ kind: 'squad' }))).toBe('Bia: oi');
  });

  it('squad sem autor, de conta apagada, mostra só o texto', () => {
    expect(lastPreview(conversation({ kind: 'squad', lastSenderName: null }))).toBe('oi');
  });

  it('mensagem apagada não mostra o texto', () => {
    expect(lastPreview(conversation({ lastDeleted: true, lastBody: null }))).toBe(DELETED_TEXT);
  });

  it('sem mensagens', () => {
    expect(lastPreview(conversation({ lastBody: null }))).toBe('Nenhuma mensagem ainda.');
  });
});

describe('datas', () => {
  it('mostra a hora no fuso de São Paulo', () => {
    expect(timeLabel('2026-11-05T15:30:00Z')).toBe('12:30');
  });

  it.each([
    ['2026-11-05T14:00:00Z', 'Hoje'],
    ['2026-11-04T14:00:00Z', 'Ontem'],
    ['2026-11-01T14:00:00Z', '01/11/2026'],
  ])('%s é %s', (iso, label) => {
    expect(dayLabel(iso, now)).toBe(label);
  });

  it('o dia segue o fuso de São Paulo, não o UTC', () => {
    expect(dayLabel('2026-11-05T02:00:00Z', now)).toBe('Ontem');
  });

  it('na lista, hoje é a hora e os outros dias são o dia', () => {
    expect(listTimeLabel('2026-11-05T15:30:00Z', now)).toBe('12:30');
    expect(listTimeLabel('2026-11-04T14:00:00Z', now)).toBe('Ontem');
    expect(listTimeLabel(null, now)).toBe('');
  });

  it('agrupa as mensagens por dia', () => {
    const days = groupByDay(
      [
        message('a', '2026-11-04T14:00:00Z'),
        message('b', '2026-11-05T14:00:00Z'),
        message('c', '2026-11-05T14:30:00Z'),
      ],
      now,
    );
    expect(days.map((d) => [d.day, d.messages.map((m) => m.id)])).toEqual([
      ['Ontem', ['a']],
      ['Hoje', ['b', 'c']],
    ]);
  });
});
