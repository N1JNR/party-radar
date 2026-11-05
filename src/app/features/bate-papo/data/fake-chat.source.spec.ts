import { DOCUMENT } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { ChatMessage } from '../domain/chat';
import { FakeChatSource } from './fake-chat.source';

function setup(search = '') {
  TestBed.configureTestingModule({
    providers: [
      FakeChatSource,
      { provide: DOCUMENT, useValue: { defaultView: { location: { search } } } },
    ],
  });
  return TestBed.inject(FakeChatSource);
}

describe('FakeChatSource', () => {
  it('começa com um squad e uma conversa, da mais recente para a mais antiga', async () => {
    const list = await setup().conversations();
    expect(list.map((c) => c.id)).toEqual(['squad-sexta', 'direct-bia']);
    expect(list[0]).toMatchObject({ memberCount: 3, unread: 2, lastSenderName: 'Bia' });
    expect(list[1].memberCount).toBe(2);
  });

  it('no primeiro acesso, começa sem conversas', async () => {
    expect(await setup('?simular=primeiro-acesso').conversations()).toEqual([]);
  });

  it('sem janela, usa o cenário padrão', async () => {
    TestBed.configureTestingModule({
      providers: [FakeChatSource, { provide: DOCUMENT, useValue: {} }],
    });
    expect(await TestBed.inject(FakeChatSource).conversations()).toHaveLength(2);
  });

  it('no cenário de erro, a primeira carga falha e a segunda funciona', async () => {
    const source = setup('?simular=erro');
    await expect(source.conversations()).rejects.toThrow();
    expect(await source.conversations()).toHaveLength(2);
  });

  it('envia uma vez só, e avisa quem ouve', async () => {
    const source = setup();
    const listener = vi.fn();
    const stop = source.subscribe(listener);
    expect(await source.send('direct-bia', 'k1', ' oi ')).toBe('sent');
    expect(await source.send('direct-bia', 'k1', 'oi')).toBe('sent');
    const messages = await source.messages('direct-bia');
    expect(messages.filter((m) => m.clientId === 'k1').map((m) => m.body)).toEqual(['oi']);
    expect(listener).toHaveBeenCalledTimes(2);
    stop();
    await source.send('direct-bia', 'k2', 'oi');
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it('não envia para quem não existe', async () => {
    expect(await setup().send('nada', 'k1', 'oi')).toBe('not_member');
  });

  it('traz as anteriores a uma mensagem', async () => {
    const source = setup();
    const all = await source.messages('squad-sexta');
    const older = await source.messages('squad-sexta', all.at(-1) as ChatMessage);
    expect(older).toHaveLength(2);
    expect(await source.messages('nada')).toEqual([]);
  });

  it('apaga só a própria mensagem', async () => {
    const source = setup();
    expect(await source.deleteMessage('m3')).toBe(false);
    expect(await source.deleteMessage('m2')).toBe(true);
    const messages = await source.messages('squad-sexta');
    expect(messages.find((m) => m.id === 'm2')).toMatchObject({ body: null, deleted: true });
  });

  it('marca como lida', async () => {
    const source = setup();
    await source.markRead('squad-sexta');
    await source.markRead('nada');
    expect((await source.conversations())[0].unread).toBe(0);
  });

  it('abre a conversa com um amigo, sem repetir', async () => {
    const source = setup();
    expect(await source.openDirect('nina')).toBe('direct-nina');
    expect(await source.openDirect('nina')).toBe('direct-nina');
    expect((await source.conversations()).filter((c) => c.id === 'direct-nina')).toHaveLength(1);
  });

  it('cria um squad, que precisa de amigos', async () => {
    const source = setup();
    expect((await source.createSquad('Sem', [])).status).toBe('no_members');
    const { status, id } = await source.createSquad('Novo', ['bia']);
    expect(status).toBe('created');
    expect(await source.squadMembers(id as string)).toHaveLength(2);
  });

  it('o dono renomeia, adiciona e remove', async () => {
    const source = setup();
    expect(await source.renameSquad('squad-sexta', 'Novo')).toBe(true);
    expect(await source.addMember('squad-sexta', 'nina')).toBe('added');
    expect(await source.addMember('squad-sexta', 'nina')).toBe('already');
    expect(await source.removeMember('squad-sexta', 'nina')).toBe(true);
    const members = await source.squadMembers('squad-sexta');
    expect(members.map((m) => m.id)).not.toContain('nina');
    expect((await source.conversations()).find((c) => c.id === 'squad-sexta')?.title).toBe('Novo');
  });

  it('quem não é dono não renomeia, adiciona nem remove', async () => {
    const source = setup();
    expect(await source.renameSquad('direct-bia', 'Novo')).toBe(false);
    expect(await source.addMember('direct-bia', 'nina')).toBe('not_owner');
    expect(await source.removeMember('direct-bia', 'nina')).toBe(false);
  });

  it('sair tira a conversa da lista', async () => {
    const source = setup();
    await source.leaveSquad('squad-sexta');
    expect((await source.conversations()).map((c) => c.id)).toEqual(['direct-bia']);
    expect(await source.squadMembers('nada')).toEqual([]);
  });
});
