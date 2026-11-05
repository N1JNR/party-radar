import { TestBed } from '@angular/core/testing';

import { SUPABASE } from '../../../core/supabase/supabase.client';
import { ChatMessage } from '../domain/chat';
import { SupabaseChatSource } from './supabase-chat.source';

const ok = (data: unknown) => ({ data, error: null });
const failed = { data: null, error: new Error('banco fora') };

const conversationRow = {
  conversation_id: 'c1',
  kind: 'squad',
  title: 'Squad',
  avatar_url: null,
  is_owner: true,
  member_count: 3,
  can_send: true,
  last_body: 'oi',
  last_deleted: false,
  last_sender_name: 'Bia',
  last_at: '2026-11-05T12:00:00Z',
  unread: 2,
};

const messageRow = {
  message_id: 'm1',
  sender_id: 'bia',
  sender_name: 'Bia',
  sender_avatar_url: null,
  client_id: 'k1',
  body: 'oi',
  created_at: '2026-11-05T12:00:00Z',
  deleted: false,
  mine: true,
};

function setup(results: Record<string, { data: unknown; error: unknown }> = {}) {
  const rpc = vi.fn((name: string) => Promise.resolve(results[name] ?? ok(null)));
  const channel = {
    on: vi.fn(() => channel),
    subscribe: vi.fn((callback: (status: string) => void) => {
      callback('SUBSCRIBED');
      return channel;
    }),
  };
  const removeChannel = vi.fn();
  TestBed.configureTestingModule({
    providers: [
      SupabaseChatSource,
      { provide: SUPABASE, useValue: { rpc, channel: vi.fn(() => channel), removeChannel } },
    ],
  });
  return { source: TestBed.inject(SupabaseChatSource), rpc, channel, removeChannel };
}

describe('SupabaseChatSource', () => {
  it('monta a lista de conversas (spec 007, CA18, CA19)', async () => {
    const { source } = setup({ my_conversations: ok([conversationRow]) });
    expect(await source.conversations()).toEqual([
      {
        id: 'c1',
        kind: 'squad',
        title: 'Squad',
        avatarUrl: null,
        isOwner: true,
        memberCount: 3,
        canSend: true,
        lastBody: 'oi',
        lastDeleted: false,
        lastSenderName: 'Bia',
        lastAt: '2026-11-05T12:00:00Z',
        unread: 2,
      },
    ]);
  });

  it('dono nulo, em conversa a dois, não é dono', async () => {
    const { source } = setup({ my_conversations: ok([{ ...conversationRow, is_owner: null }]) });
    expect((await source.conversations())[0].isOwner).toBe(false);
  });

  it('resposta nula conta como lista vazia', async () => {
    const { source } = setup();
    expect(await source.conversations()).toEqual([]);
    expect(await source.messages('c1')).toEqual([]);
    expect(await source.squadMembers('c1')).toEqual([]);
  });

  it('traz as mensagens mais recentes (CA6)', async () => {
    const { source, rpc } = setup({ conversation_messages: ok([messageRow]) });
    const [first] = await source.messages('c1');
    expect(first).toMatchObject({
      id: 'm1',
      clientId: 'k1',
      senderName: 'Bia',
      body: 'oi',
      mine: true,
    });
    expect(rpc).toHaveBeenCalledWith('conversation_messages', { p_conversation: 'c1' });
  });

  it('pede as anteriores a partir de uma mensagem (CA6)', async () => {
    const { source, rpc } = setup();
    await source.messages('c1', {
      id: 'm1',
      createdAt: '2026-11-05T12:00:00Z',
    } as ChatMessage);
    expect(rpc).toHaveBeenCalledWith('conversation_messages', {
      p_conversation: 'c1',
      p_before_at: '2026-11-05T12:00:00Z',
      p_before_id: 'm1',
    });
  });

  it('envia e devolve o resultado (CA3, CA10)', async () => {
    const { source, rpc } = setup({
      send_message: ok([{ status: 'rate_limited', message_id: null }]),
    });
    expect(await source.send('c1', 'k1', 'oi')).toBe('rate_limited');
    expect(rpc).toHaveBeenCalledWith('send_message', {
      p_conversation: 'c1',
      p_client_id: 'k1',
      p_body: 'oi',
    });
  });

  it('sem resposta do envio, trata como quem não participa', async () => {
    const { source } = setup();
    expect(await source.send('c1', 'k1', 'oi')).toBe('not_member');
  });

  it('apaga a própria mensagem (CA5)', async () => {
    const { source, rpc } = setup({ delete_message: ok(true) });
    expect(await source.deleteMessage('m1')).toBe(true);
    expect(rpc).toHaveBeenCalledWith('delete_message', { p_message: 'm1' });
  });

  it('marca como lida (CA18)', async () => {
    const { source, rpc } = setup();
    await source.markRead('c1');
    expect(rpc).toHaveBeenCalledWith('mark_conversation_read', { p_conversation: 'c1' });
  });

  it('abre a conversa com um amigo (CA1)', async () => {
    const { source } = setup({ open_direct: ok('c1') });
    expect(await source.openDirect('bia')).toBe('c1');
  });

  it('quem não é amigo não abre conversa (CA2)', async () => {
    const { source } = setup({ open_direct: ok(null) });
    expect(await source.openDirect('duda')).toBeNull();
  });

  it('cria um squad (CA11)', async () => {
    const { source, rpc } = setup({
      create_squad: ok([{ status: 'created', conversation_id: 'c2' }]),
    });
    expect(await source.createSquad('Squad', ['bia'])).toEqual({ status: 'created', id: 'c2' });
    expect(rpc).toHaveBeenCalledWith('create_squad', { p_name: 'Squad', p_members: ['bia'] });
  });

  it('sem resposta ao criar, trata como nome inválido', async () => {
    const { source } = setup();
    expect(await source.createSquad('Squad', ['bia'])).toEqual({
      status: 'invalid_name',
      id: null,
    });
  });

  it('renomeia, adiciona, remove e sai (CA13, CA15)', async () => {
    const { source, rpc } = setup({
      rename_squad: ok(true),
      add_squad_member: ok('added'),
      remove_squad_member: ok(true),
    });
    expect(await source.renameSquad('c1', 'Novo')).toBe(true);
    expect(await source.addMember('c1', 'bia')).toBe('added');
    expect(await source.removeMember('c1', 'bia')).toBe(true);
    await source.leaveSquad('c1');
    expect(rpc).toHaveBeenCalledWith('leave_squad', { p_conversation: 'c1' });
  });

  it('traz os membros, com o dono (CA13)', async () => {
    const { source } = setup({
      squad_members: ok([
        { user_id: 'ana', display_name: 'Ana', username: 'ana', avatar_url: null, is_owner: true },
        { user_id: 'bia', display_name: 'Bia', username: 'bia', avatar_url: null, is_owner: null },
      ]),
    });
    expect((await source.squadMembers('c1')).map((m) => [m.id, m.isOwner])).toEqual([
      ['ana', true],
      ['bia', false],
    ]);
  });

  it.each([
    ['conversations', 'my_conversations', []],
    ['messages', 'conversation_messages', ['c1']],
    ['send', 'send_message', ['c1', 'k1', 'oi']],
    ['deleteMessage', 'delete_message', ['m1']],
    ['markRead', 'mark_conversation_read', ['c1']],
    ['openDirect', 'open_direct', ['bia']],
    ['createSquad', 'create_squad', ['Squad', ['bia']]],
    ['renameSquad', 'rename_squad', ['c1', 'Novo']],
    ['addMember', 'add_squad_member', ['c1', 'bia']],
    ['removeMember', 'remove_squad_member', ['c1', 'bia']],
    ['leaveSquad', 'leave_squad', ['c1']],
    ['squadMembers', 'squad_members', ['c1']],
  ] as const)('erro em %s sobe (CA22)', async (method, name, args) => {
    const { source } = setup({ [name]: failed });
    const call = source[method] as (...params: unknown[]) => Promise<unknown>;
    await expect(call.apply(source, [...args])).rejects.toThrow('banco fora');
  });

  it('avisa ao conectar e a cada mensagem, e para de ouvir (CA3, CA8)', () => {
    const { source, channel, removeChannel } = setup();
    const listener = vi.fn();
    const stop = source.subscribe(listener);
    expect(listener).toHaveBeenCalledTimes(1);
    expect(channel.on).toHaveBeenCalledTimes(2);
    const onCalls = channel.on.mock.calls as unknown as [string, object, () => void][];
    onCalls[0][2]();
    onCalls[1][2]();
    expect(listener).toHaveBeenCalledTimes(3);
    stop();
    expect(removeChannel).toHaveBeenCalledWith(channel);
  });

  it('outros estados do canal não avisam', () => {
    const { source, channel } = setup();
    channel.subscribe.mockImplementation((callback: (status: string) => void) => {
      callback('CHANNEL_ERROR');
      return channel;
    });
    const listener = vi.fn();
    source.subscribe(listener);
    expect(listener).not.toHaveBeenCalled();
  });
});
