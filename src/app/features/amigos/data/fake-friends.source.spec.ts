import { DOCUMENT } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { FakeFriendsSource } from './fake-friends.source';

function setup(search = '') {
  TestBed.configureTestingModule({
    providers: [
      FakeFriendsSource,
      { provide: DOCUMENT, useValue: { defaultView: { location: { search } } } },
    ],
  });
  return TestBed.inject(FakeFriendsSource);
}

const ids = (list: readonly { id: string }[]) => list.map((person) => person.id);

describe('FakeFriendsSource', () => {
  it('começa com amigos e pedidos', async () => {
    const data = await setup().load();
    expect(ids(data.friends)).toEqual(['caio_fps', 'bia_souls', 'duda_gg']);
    expect(ids(data.received)).toEqual(['gui_lobby']);
    expect(ids(data.sent)).toEqual(['nina_play']);
  });

  it('no primeiro acesso, começa sem ninguém', async () => {
    const data = await setup('?simular=primeiro-acesso').load();
    expect(data).toEqual({ friends: [], received: [], sent: [], blocked: [] });
  });

  it('sem janela, usa o cenário padrão', async () => {
    TestBed.configureTestingModule({
      providers: [FakeFriendsSource, { provide: DOCUMENT, useValue: {} }],
    });
    expect(ids((await TestBed.inject(FakeFriendsSource).load()).friends)).toHaveLength(3);
  });

  it('no cenário de erro, a primeira carga falha e a segunda funciona', async () => {
    const source = setup('?simular=erro');
    await expect(source.load()).rejects.toThrow();
    expect((await source.load()).friends).toHaveLength(3);
  });

  it.each([
    ['bia_souls', 'friend'],
    ['gui_lobby', 'received'],
    ['nina_play', 'sent'],
    ['rafa_jogos', 'none'],
  ])('acha %s como %s', async (username, relation) => {
    expect(await setup().find(username)).toMatchObject({ username, relation });
  });

  it('quem não existe não é achado', async () => {
    expect(await setup().find('nao_existe')).toBeNull();
  });

  it('pede amizade a quem existe, uma vez só', async () => {
    const source = setup();
    expect(await source.send('rafa_jogos')).toBe('sent');
    expect(await source.send('rafa_jogos')).toBe('already_sent');
    expect(ids((await source.load()).sent)).toContain('rafa_jogos');
  });

  it('pedir a quem já pediu vira amizade', async () => {
    const source = setup();
    expect(await source.send('gui_lobby')).toBe('friends');
    expect(ids((await source.load()).friends)).toContain('gui_lobby');
  });

  it('pedir a quem não existe avisa', async () => {
    expect(await setup().send('nao_existe')).toBe('not_found');
  });

  it('aceitar vira amizade', async () => {
    const source = setup();
    expect(await source.answer('gui_lobby', true)).toBe(true);
    const data = await source.load();
    expect(ids(data.friends)).toContain('gui_lobby');
    expect(data.received).toEqual([]);
  });

  it('recusar tira o pedido, sem virar amizade', async () => {
    const source = setup();
    expect(await source.answer('gui_lobby', false)).toBe(true);
    const data = await source.load();
    expect(ids(data.friends)).not.toContain('gui_lobby');
    expect(data.received).toEqual([]);
  });

  it('responder um pedido que não existe devolve false', async () => {
    expect(await setup().answer('nao_existe', true)).toBe(false);
  });

  it('cancela, remove, bloqueia e desbloqueia', async () => {
    const source = setup();
    await source.cancel('nina_play');
    await source.remove('caio_fps');
    await source.block('bia_souls');
    let data = await source.load();
    expect(data.sent).toEqual([]);
    expect(ids(data.friends)).toEqual(['duda_gg']);
    expect(ids(data.blocked)).toEqual(['bia_souls']);
    expect(await source.find('bia_souls')).toMatchObject({ relation: 'blocked' });
    await source.unblock('bia_souls');
    data = await source.load();
    expect(data.blocked).toEqual([]);
    expect(ids(data.friends)).toEqual(['duda_gg']);
  });

  it('bloquear quem não está nas listas não muda nada', async () => {
    const source = setup();
    await source.block('nao_existe');
    expect((await source.load()).blocked).toEqual([]);
  });
});
