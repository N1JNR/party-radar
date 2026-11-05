import { TestBed } from '@angular/core/testing';

import { Conversation } from '../domain/chat';
import { CHAT_SOURCE, ChatSource } from './chat.source';
import { CHAT_REFRESH_MS, ChatStore } from './chat.store';

const conversation = (id: string, unread = 0): Conversation => ({
  id,
  kind: 'direct',
  title: id,
  avatarUrl: null,
  isOwner: false,
  memberCount: 2,
  canSend: true,
  lastBody: null,
  lastDeleted: false,
  lastSenderName: null,
  lastAt: null,
  unread,
});

function setup(overrides: Partial<ChatSource> = {}) {
  const stop = vi.fn();
  let notify: () => void = () => undefined;
  const source = {
    conversations: vi.fn(() => Promise.resolve([conversation('a', 2), conversation('b')])),
    subscribe: vi.fn((listener: () => void) => {
      notify = listener;
      return stop;
    }),
    ...overrides,
  };
  TestBed.configureTestingModule({
    providers: [{ provide: CHAT_SOURCE, useValue: source }],
  });
  return {
    store: TestBed.inject(ChatStore),
    source: source as unknown as Record<keyof ChatSource, ReturnType<typeof vi.fn>>,
    stop,
    notify: () => notify(),
  };
}

describe('ChatStore', () => {
  afterEach(() => {
    TestBed.inject(ChatStore).stop();
    vi.useRealTimers();
  });

  it('ao ligar, carrega e conta as conversas com novidade (spec 007, CA18)', async () => {
    const { store } = setup();
    expect(store.status()).toBe('idle');
    store.start();
    expect(store.status()).toBe('loading');
    await vi.waitFor(() => expect(store.status()).toBe('ready'));
    expect(store.withNews()).toBe(1);
    expect(store.conversation('b')?.id).toBe('b');
    expect(store.conversation(null)).toBeNull();
  });

  it('liga o tempo real uma vez só', async () => {
    const { store, source } = setup();
    store.start();
    store.start();
    expect(source.subscribe).toHaveBeenCalledTimes(1);
  });

  it('erro na carga vira o estado de erro, e carregar de novo funciona (CA22)', async () => {
    const conversations = vi.fn(() => Promise.reject(new Error('rede')));
    const { store } = setup({ conversations: conversations as ChatSource['conversations'] });
    await store.load();
    expect(store.status()).toBe('error');
    (conversations as ReturnType<typeof vi.fn>).mockResolvedValue([conversation('a')]);
    await store.load();
    expect(store.status()).toBe('ready');
  });

  it('uma novidade sobe a versão e relê, sem o carregando (CA3)', async () => {
    const { store, source, notify } = setup();
    store.start();
    await vi.waitFor(() => expect(store.status()).toBe('ready'));
    source.conversations.mockResolvedValue([conversation('a', 5)]);
    notify();
    expect(store.version()).toBe(1);
    expect(store.status()).toBe('ready');
    await vi.waitFor(() => expect(store.conversations()).toHaveLength(1));
  });

  it('se a releitura falhar, fica o que estava (CA8)', async () => {
    const { store, source } = setup();
    await store.load();
    source.conversations.mockRejectedValue(new Error('rede'));
    await store.refresh();
    expect(store.status()).toBe('ready');
    expect(store.conversations()).toHaveLength(2);
  });

  it('só vale a leitura mais recente', async () => {
    const resolvers: ((value: Conversation[]) => void)[] = [];
    const { store } = setup({ conversations: () => new Promise((r) => resolvers.push(r)) });
    const older = store.refresh();
    const newer = store.refresh();
    resolvers[1]([conversation('novo')]);
    await newer;
    resolvers[0]([conversation('velho')]);
    await older;
    expect(store.conversations().map((c) => c.id)).toEqual(['novo']);
  });

  it('um erro antigo não troca o estado', async () => {
    const rejects: ((reason: Error) => void)[] = [];
    const resolvers: ((value: Conversation[]) => void)[] = [];
    const { store } = setup({
      conversations: () =>
        new Promise((resolve, reject) => {
          resolvers.push(resolve);
          rejects.push(reject);
        }),
    });
    const first = store.load();
    const second = store.load();
    resolvers[1]([]);
    await second;
    rejects[0](new Error('rede'));
    await first;
    expect(store.status()).toBe('ready');
  });

  it('relê a cada minuto, se o tempo real falhar sem avisar (CA8)', async () => {
    vi.useFakeTimers();
    const { store } = setup();
    store.start();
    await vi.advanceTimersByTimeAsync(CHAT_REFRESH_MS);
    expect(store.version()).toBe(1);
  });

  it('abre a conversa com um amigo e relê a lista (CA1)', async () => {
    const { store, source } = setup({ openDirect: () => Promise.resolve('c9') });
    expect(await store.openDirect('bia')).toBe('c9');
    expect(source.conversations).toHaveBeenCalled();
  });

  it('quem não é amigo ou uma falha devolve null (CA2)', async () => {
    const { store, source } = setup({ openDirect: () => Promise.reject(new Error('rede')) });
    expect(await store.openDirect('duda')).toBeNull();
    expect(source.conversations).not.toHaveBeenCalled();
  });

  it('ao sair, para de ouvir e esquece tudo', async () => {
    const { store, stop } = setup();
    store.start();
    await vi.waitFor(() => expect(store.status()).toBe('ready'));
    store.stop();
    expect(stop).toHaveBeenCalled();
    expect(store.conversations()).toEqual([]);
    expect(store.status()).toBe('idle');
    store.stop();
    expect(stop).toHaveBeenCalledTimes(1);
  });

  it('uma leitura em andamento não volta depois de sair', async () => {
    let finish: (value: Conversation[]) => void = () => undefined;
    const { store } = setup({ conversations: () => new Promise((r) => (finish = r)) });
    const reading = store.refresh();
    store.stop();
    finish([conversation('a')]);
    await reading;
    expect(store.conversations()).toEqual([]);
  });
});
