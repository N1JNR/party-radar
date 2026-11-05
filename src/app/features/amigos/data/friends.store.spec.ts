import { TestBed } from '@angular/core/testing';

import { FoundPlayer, FriendsData } from '../domain/friends';
import { FRIENDS_SOURCE, FriendsSource } from './friends.source';
import { FriendsStore } from './friends.store';

const person = (id: string) => ({ id, name: id, username: id, avatarUrl: null });

const data = (): FriendsData => ({
  friends: [
    { ...person('caio'), playing: null },
    { ...person('bia'), playing: 'Dota 2' },
  ],
  received: [person('gui')],
  sent: [],
  blocked: [],
});

const found: FoundPlayer = { ...person('rafa_jogos'), relation: 'none' };

function setup(source: Partial<FriendsSource> = {}) {
  const full: FriendsSource = {
    load: vi.fn(() => Promise.resolve(data())),
    find: vi.fn(() => Promise.resolve(found)),
    send: vi.fn(() => Promise.resolve('sent' as const)),
    answer: vi.fn(() => Promise.resolve(true)),
    cancel: vi.fn(() => Promise.resolve()),
    remove: vi.fn(() => Promise.resolve()),
    block: vi.fn(() => Promise.resolve()),
    unblock: vi.fn(() => Promise.resolve()),
    ...source,
  };
  TestBed.configureTestingModule({
    providers: [FriendsStore, { provide: FRIENDS_SOURCE, useValue: full }],
  });
  return { store: TestBed.inject(FriendsStore), source: full };
}

describe('FriendsStore', () => {
  it('carrega e ordena os amigos, com quem joga primeiro (CA12)', async () => {
    const { store } = setup();
    expect(store.status()).toBe('loading');
    expect(store.friends()).toEqual([]);
    await store.load();
    expect(store.status()).toBe('ready');
    expect(store.friends().map((f) => f.id)).toEqual(['bia', 'caio']);
  });

  it('erro na carga vira o estado de erro (CA19)', async () => {
    const { store } = setup({ load: () => Promise.reject(new Error('rede')) });
    await store.load();
    expect(store.status()).toBe('error');
  });

  it('relê sem voltar ao carregando (CA13)', async () => {
    const load = vi.fn(() => Promise.resolve(data()));
    const { store } = setup({ load });
    await store.load();
    load.mockResolvedValue({ ...data(), friends: [] });
    const refreshing = store.refresh();
    expect(store.status()).toBe('ready');
    await refreshing;
    expect(store.friends()).toEqual([]);
  });

  it('se a releitura falhar, fica o que estava', async () => {
    const load = vi.fn(() => Promise.resolve(data()));
    const { store } = setup({ load });
    await store.load();
    load.mockRejectedValue(new Error('rede'));
    await store.refresh();
    expect(store.friends()).toHaveLength(2);
  });

  it('não relê antes de carregar', async () => {
    const { store, source } = setup();
    await store.refresh();
    expect(source.load).not.toHaveBeenCalled();
  });

  describe('busca pelo @usuário', () => {
    it('limpa o texto e acha a pessoa (CA3)', async () => {
      const { store, source } = setup();
      const finding = store.find(' @Rafa_Jogos ');
      expect(store.lookup()).toEqual({ status: 'searching' });
      await finding;
      expect(source.find).toHaveBeenCalledWith('rafa_jogos');
      expect(store.lookup()).toEqual({ status: 'found', player: found });
    });

    it('sem pessoa, não achou (CA4)', async () => {
      const { store } = setup({ find: () => Promise.resolve(null) });
      await store.find('nao_existe');
      expect(store.lookup()).toEqual({ status: 'not-found' });
    });

    it('texto inválido nem vai ao servidor (CA4)', async () => {
      const { store, source } = setup();
      await store.find('a b');
      expect(source.find).not.toHaveBeenCalled();
      expect(store.lookup()).toEqual({ status: 'not-found' });
    });

    it('falha na busca vira erro, sem dizer que a pessoa não existe (CA19)', async () => {
      const { store } = setup({ find: () => Promise.reject(new Error('rede')) });
      await store.find('rafa_jogos');
      expect(store.lookup()).toEqual({ status: 'error' });
    });

    it('só a busca mais recente vale', async () => {
      const resolvers: ((value: FoundPlayer | null) => void)[] = [];
      const { store } = setup({ find: () => new Promise((r) => resolvers.push(r)) });
      const first = store.find('primeira');
      const second = store.find('segunda');
      resolvers[1](found);
      await second;
      resolvers[0](null);
      await first;
      expect(store.lookup()).toEqual({ status: 'found', player: found });
    });

    it('erro de uma busca antiga não atrapalha a mais recente', async () => {
      const rejects: ((reason: Error) => void)[] = [];
      const find = vi.fn(() => new Promise<null>((_resolve, reject) => rejects.push(reject)));
      const { store } = setup({ find });
      const first = store.find('primeira');
      store.clearLookup();
      rejects[0](new Error('rede'));
      await first;
      expect(store.lookup()).toEqual({ status: 'idle' });
    });
  });

  describe('ações', () => {
    it('pede amizade, relê a lista e atualiza a busca (CA3, CA6)', async () => {
      const { store, source } = setup();
      await store.load();
      expect(await store.send(found)).toBe('sent');
      expect(source.send).toHaveBeenCalledWith('rafa_jogos');
      expect(source.load).toHaveBeenCalledTimes(2);
      expect(source.find).toHaveBeenCalledWith('rafa_jogos');
    });

    it('pedido que falhou devolve null, sem reler a busca (CA19)', async () => {
      const { store, source } = setup({ send: () => Promise.reject(new Error('rede')) });
      await store.load();
      expect(await store.send(found)).toBeNull();
      expect(source.find).not.toHaveBeenCalled();
    });

    it.each([
      ['answer', ['gui', true]],
      ['cancel', ['gui']],
      ['remove', ['gui']],
      ['block', ['gui']],
      ['unblock', ['gui']],
    ] as const)('%s relê a lista (CA8 a CA10, CA15 a CA17)', async (method, args) => {
      const { store, source } = setup();
      await store.load();
      const call = store[method] as (...params: unknown[]) => Promise<boolean>;
      expect(await call.apply(store, [...args])).toBe(true);
      expect(source[method]).toHaveBeenCalledWith(...args);
      expect(source.load).toHaveBeenCalledTimes(2);
      expect(store.busy()).toBe(false);
    });

    it('fica ocupada durante a ação', async () => {
      let finish = () => undefined as void;
      const { store } = setup({ remove: () => new Promise((resolve) => (finish = resolve)) });
      await store.load();
      const removing = store.remove('gui');
      expect(store.busy()).toBe(true);
      finish();
      await removing;
      expect(store.busy()).toBe(false);
    });

    it('ação que falhou devolve false e não muda a lista (CA19)', async () => {
      const { store } = setup({ remove: () => Promise.reject(new Error('rede')) });
      await store.load();
      expect(await store.remove('caio')).toBe(false);
      expect(store.friends()).toHaveLength(2);
      expect(store.busy()).toBe(false);
    });
  });
});
