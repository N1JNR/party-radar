import { TestBed } from '@angular/core/testing';

import { SUPABASE } from '../../../core/supabase/supabase.client';
import { SupabaseFriendsSource } from './supabase-friends.source';

const row = (id: string) => ({
  user_id: id,
  display_name: `Nome ${id}`,
  username: id,
  avatar_url: null,
});

const ok = (data: unknown) => ({ data, error: null });
const failed = { data: null, error: new Error('banco fora') };

function setup(results: Record<string, { data: unknown; error: unknown }> = {}) {
  const rpc = vi.fn((name: string) => Promise.resolve(results[name] ?? ok(null)));
  TestBed.configureTestingModule({
    providers: [SupabaseFriendsSource, { provide: SUPABASE, useValue: { rpc } }],
  });
  return { source: TestBed.inject(SupabaseFriendsSource), rpc };
}

describe('SupabaseFriendsSource', () => {
  it('monta amigos, pedidos e bloqueios (spec 006, CA12, CA13, CA17)', async () => {
    const { source } = setup({
      my_friends: ok([{ ...row('bia'), current_game: 'Dota 2' }]),
      my_friend_requests: ok([
        { ...row('caio'), direction: 'received' },
        { ...row('duda'), direction: 'sent' },
      ]),
      my_blocks: ok([row('edu')]),
    });
    const data = await source.load();
    expect(data.friends).toEqual([
      { id: 'bia', name: 'Nome bia', username: 'bia', avatarUrl: null, playing: 'Dota 2' },
    ]);
    expect(data.received.map((p) => p.id)).toEqual(['caio']);
    expect(data.sent.map((p) => p.id)).toEqual(['duda']);
    expect(data.blocked.map((p) => p.id)).toEqual(['edu']);
  });

  it('resposta nula conta como lista vazia', async () => {
    const { source } = setup();
    expect(await source.load()).toEqual({ friends: [], received: [], sent: [], blocked: [] });
  });

  it.each(['my_friends', 'my_friend_requests', 'my_blocks'])(
    'erro em %s sobe, para a tela mostrar o erro (CA19)',
    async (name) => {
      const { source } = setup({ [name]: failed });
      await expect(source.load()).rejects.toThrow('banco fora');
    },
  );

  it('acha pelo @usuário, com a relação (CA3, CA6)', async () => {
    const { source, rpc } = setup({ find_player: ok([{ ...row('bia'), relation: 'friend' }]) });
    expect(await source.find('bia')).toMatchObject({ id: 'bia', relation: 'friend' });
    expect(rpc).toHaveBeenCalledWith('find_player', { p_username: 'bia' });
  });

  it('sem linha, não achou (CA4)', async () => {
    const { source } = setup({ find_player: ok([]) });
    expect(await source.find('nao_existe')).toBeNull();
  });

  it('resposta nula também é não achou', async () => {
    const { source } = setup();
    expect(await source.find('bia')).toBeNull();
  });

  it('pede amizade e devolve o resultado (CA3)', async () => {
    const { source, rpc } = setup({ send_friend_request: ok('sent') });
    expect(await source.send('bia')).toBe('sent');
    expect(rpc).toHaveBeenCalledWith('send_friend_request', { p_user: 'bia' });
  });

  it('responde um pedido (CA8, CA9)', async () => {
    const { source, rpc } = setup({ answer_friend_request: ok(true) });
    expect(await source.answer('bia', false)).toBe(true);
    expect(rpc).toHaveBeenCalledWith('answer_friend_request', { p_from: 'bia', p_accept: false });
  });

  it('pedido que não estava mais aberto devolve false', async () => {
    const { source } = setup({ answer_friend_request: ok(false) });
    expect(await source.answer('bia', true)).toBe(false);
  });

  it.each([
    ['cancel', 'cancel_friend_request', { p_to: 'bia' }],
    ['remove', 'remove_friend', { p_friend: 'bia' }],
    ['block', 'block_user', { p_user: 'bia' }],
    ['unblock', 'unblock_user', { p_user: 'bia' }],
  ] as const)('%s chama %s (CA10, CA15 a CA17)', async (method, name, args) => {
    const { source, rpc } = setup();
    await source[method]('bia');
    expect(rpc).toHaveBeenCalledWith(name, args);
  });

  it.each([
    ['find', 'find_player', () => ['bia']],
    ['send', 'send_friend_request', () => ['bia']],
    ['answer', 'answer_friend_request', () => ['bia', true]],
    ['cancel', 'cancel_friend_request', () => ['bia']],
    ['remove', 'remove_friend', () => ['bia']],
    ['block', 'block_user', () => ['bia']],
    ['unblock', 'unblock_user', () => ['bia']],
  ] as const)('erro em %s sobe (CA19)', async (method, name, args) => {
    const { source } = setup({ [name]: failed });
    const call = source[method] as (...params: unknown[]) => Promise<unknown>;
    await expect(call.apply(source, [...args()])).rejects.toThrow('banco fora');
  });
});
