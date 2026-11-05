import { TestBed } from '@angular/core/testing';

import { ChatMessage } from '../domain/chat';
import { CHAT_SOURCE, ChatSource } from './chat.source';
import { ConversationStore } from './conversation.store';

const message = (id: string, clientId = id, minute = 0): ChatMessage => ({
  id,
  clientId,
  senderId: 'ana',
  senderName: 'Ana',
  senderAvatarUrl: null,
  body: id,
  createdAt: new Date(Date.UTC(2026, 10, 5, 12, minute)).toISOString(),
  deleted: false,
  mine: false,
});

const fullPage = () => Array.from({ length: 50 }, (_, i) => message(`m${i}`, `m${i}`, i));

function setup(overrides: Partial<ChatSource> = {}) {
  const source = {
    messages: vi.fn(() => Promise.resolve([message('a')])),
    send: vi.fn(() => Promise.resolve('sent' as const)),
    deleteMessage: vi.fn(() => Promise.resolve(true)),
    markRead: vi.fn(() => Promise.resolve()),
    ...overrides,
  };
  TestBed.configureTestingModule({
    providers: [ConversationStore, { provide: CHAT_SOURCE, useValue: source }],
  });
  return {
    store: TestBed.inject(ConversationStore),
    source: source as unknown as Record<keyof ChatSource, ReturnType<typeof vi.fn>>,
  };
}

describe('ConversationStore', () => {
  it('abre a conversa e marca como lida (spec 007, CA18)', async () => {
    const { store, source } = setup();
    const opening = store.open('c1');
    expect(store.status()).toBe('loading');
    await opening;
    expect(store.status()).toBe('ready');
    expect(store.messages().map((m) => m.id)).toEqual(['a']);
    expect(source.markRead).toHaveBeenCalledWith('c1');
    expect(store.hasOlder()).toBe(false);
  });

  it('erro ao abrir vira o estado de erro (CA22)', async () => {
    const { store } = setup({ messages: () => Promise.reject(new Error('rede')) });
    await store.open('c1');
    expect(store.status()).toBe('error');
  });

  it('com a aba escondida, não marca como lida (CA18)', async () => {
    const { store, source } = setup();
    const hidden = vi.spyOn(document, 'hidden', 'get').mockReturnValue(true);
    await store.open('c1');
    expect(source.markRead).not.toHaveBeenCalled();
    hidden.mockRestore();
    await store.refresh();
    expect(source.markRead).toHaveBeenCalledWith('c1');
  });

  it('apagar uma mensagem fora das 50 mais novas muda a tela (CA5)', async () => {
    const { store, source } = setup({
      messages: vi.fn(() => Promise.resolve([message('antiga'), message('nova', 'nova', 1)])),
    });
    await store.open('c1');
    source.messages.mockResolvedValue([message('nova', 'nova', 1)]);
    expect(await store.deleteMessage('antiga')).toBe(true);
    expect(store.messages().find((m) => m.id === 'antiga')).toMatchObject({
      body: null,
      deleted: true,
    });
  });

  it('depois de mais de 50 perdidas, recomeça das novas, sem buraco (CA8)', async () => {
    const { store, source } = setup({ messages: vi.fn(() => Promise.resolve([message('a')])) });
    await store.open('c1');
    source.messages.mockResolvedValue(fullPage());
    await store.refresh();
    expect(store.messages().some((m) => m.id === 'a')).toBe(false);
    expect(store.messages()).toHaveLength(50);
    expect(store.hasOlder()).toBe(true);
  });

  it('página cheia que encosta no que já está na tela só junta (CA8)', async () => {
    const page = fullPage();
    const { store, source } = setup({ messages: vi.fn(() => Promise.resolve([page[0]])) });
    await store.open('c1');
    source.messages.mockResolvedValue(page);
    await store.refresh();
    expect(store.hasOlder()).toBe(false);
    expect(store.messages()).toHaveLength(50);
  });

  it('a mensagem que falhou volta quando se volta à conversa (CA9)', async () => {
    const { store } = setup({ send: () => Promise.resolve('rate_limited' as const) });
    await store.open('c1');
    await store.send('oi');
    await store.open('c2');
    expect(store.pending()).toEqual([]);
    await store.open('c1');
    expect(store.pending().map((item) => [item.body, item.status])).toEqual([['oi', 'failed']]);
  });

  it('fechar a tela da conversa também guarda o que falhou (CA9)', async () => {
    const { store } = setup({ send: () => Promise.resolve('rate_limited' as const) });
    await store.open('c1');
    await store.send('oi');
    store.close();
    expect(store.pending()).toEqual([]);
    await store.open('c1');
    expect(store.pending()).toHaveLength(1);
  });

  it('o que estava saindo ao trocar volta como falha, e some se já chegou (CA9)', async () => {
    const send = vi.fn(() => new Promise<'sent'>(() => undefined));
    const { store, source } = setup({ send });
    await store.open('c1');
    void store.send('oi');
    const clientId = store.pending()[0].clientId;
    await store.open('c2');
    source.messages.mockResolvedValueOnce([message('a')]);
    await store.open('c1');
    expect(store.pending()[0].status).toBe('failed');
    await store.open('c2');
    source.messages.mockResolvedValueOnce([message('x', clientId)]);
    await store.open('c1');
    expect(store.pending()).toEqual([]);
  });

  it('falha ao marcar como lida não atrapalha', async () => {
    const { store } = setup({ markRead: () => Promise.reject(new Error('rede')) });
    await store.open('c1');
    expect(store.status()).toBe('ready');
  });

  it('só vale a conversa aberta por último', async () => {
    const resolvers: ((value: ChatMessage[]) => void)[] = [];
    const { store } = setup({ messages: () => new Promise((r) => resolvers.push(r)) });
    const first = store.open('c1');
    const second = store.open('c2');
    resolvers[1]([message('b')]);
    await second;
    resolvers[0]([message('a')]);
    await first;
    expect(store.messages().map((m) => m.id)).toEqual(['b']);
  });

  it('um erro antigo não troca o estado da conversa aberta', async () => {
    const rejects: ((reason: Error) => void)[] = [];
    const resolvers: ((value: ChatMessage[]) => void)[] = [];
    const { store } = setup({
      messages: () =>
        new Promise((resolve, reject) => {
          resolvers.push(resolve);
          rejects.push(reject);
        }),
    });
    const first = store.open('c1');
    const second = store.open('c2');
    resolvers[1]([]);
    await second;
    rejects[0](new Error('rede'));
    await first;
    expect(store.status()).toBe('ready');
  });

  it('fechar esquece tudo', async () => {
    const { store } = setup();
    await store.open('c1');
    store.close();
    expect(store.status()).toBe('idle');
    expect(store.messages()).toEqual([]);
  });

  it('relê juntando, sem repetir (CA3, CA8)', async () => {
    const { store, source } = setup();
    await store.open('c1');
    source.messages.mockResolvedValue([message('a'), message('b', 'b', 1)]);
    await store.refresh();
    expect(store.messages().map((m) => m.id)).toEqual(['a', 'b']);
  });

  it('não relê com a conversa fechada ou carregando', async () => {
    const { store, source } = setup();
    await store.refresh();
    expect(source.messages).not.toHaveBeenCalled();
  });

  it('se a releitura falhar, fica o que estava (CA8)', async () => {
    const { store, source } = setup();
    await store.open('c1');
    source.messages.mockRejectedValue(new Error('rede'));
    await store.refresh();
    expect(store.messages()).toHaveLength(1);
  });

  it('uma releitura de outra conversa é ignorada', async () => {
    let finish: (value: ChatMessage[]) => void = () => undefined;
    const { store, source } = setup();
    await store.open('c1');
    source.messages.mockImplementationOnce(() => new Promise((r) => (finish = r)));
    const reading = store.refresh();
    store.close();
    finish([message('velha')]);
    await reading;
    expect(store.messages()).toEqual([]);
  });

  describe('anteriores (CA6)', () => {
    it('página cheia indica que há mais, e carrega juntando', async () => {
      const { store, source } = setup({ messages: vi.fn(() => Promise.resolve(fullPage())) });
      await store.open('c1');
      expect(store.hasOlder()).toBe(true);
      const oldest = store.messages()[0];
      (source.messages as ReturnType<typeof vi.fn>).mockResolvedValue([
        { ...message('antiga'), createdAt: '2026-11-05T11:00:00.000Z' },
      ]);
      await store.loadOlder();
      expect(source.messages).toHaveBeenLastCalledWith('c1', oldest);
      expect(store.messages()[0].id).toBe('antiga');
      expect(store.hasOlder()).toBe(false);
      expect(store.loadingOlder()).toBe(false);
    });

    it('sem mais mensagens, não pede', async () => {
      const { store, source } = setup();
      await store.open('c1');
      source.messages.mockClear();
      await store.loadOlder();
      expect(source.messages).not.toHaveBeenCalled();
    });

    it('sem conversa aberta, não pede', async () => {
      const { store, source } = setup();
      await store.loadOlder();
      expect(source.messages).not.toHaveBeenCalled();
    });

    it('se falhar, deixa tentar de novo', async () => {
      const { store, source } = setup({ messages: vi.fn(() => Promise.resolve(fullPage())) });
      await store.open('c1');
      (source.messages as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('rede'));
      await store.loadOlder();
      expect(store.hasOlder()).toBe(true);
      expect(store.loadingOlder()).toBe(false);
    });

    it('resposta de outra conversa é ignorada', async () => {
      const { store, source } = setup({ messages: vi.fn(() => Promise.resolve(fullPage())) });
      await store.open('c1');
      let finish: (value: ChatMessage[]) => void = () => undefined;
      (source.messages as ReturnType<typeof vi.fn>).mockImplementationOnce(
        () => new Promise((r) => (finish = r)),
      );
      const loading = store.loadOlder();
      store.close();
      finish([message('velha')]);
      await loading;
      expect(store.messages()).toEqual([]);
    });
  });

  describe('envio (CA3, CA9, CA10)', () => {
    it('aparece com "Enviando…" e some quando volta do servidor', async () => {
      const { store, source } = setup();
      await store.open('c1');
      let clientId = '';
      (source.send as ReturnType<typeof vi.fn>).mockImplementation((_c: string, id: string) => {
        clientId = id;
        source.messages.mockResolvedValue([message('novo', id, 1)]);
        return Promise.resolve('sent');
      });
      const sending = store.send('oi');
      expect(store.pending()).toEqual([
        expect.objectContaining({ body: 'oi', status: 'sending', reason: null }),
      ]);
      await sending;
      expect(clientId).not.toBe('');
      expect(store.pending()).toEqual([]);
      expect(store.messages().map((m) => m.id)).toContain('novo');
    });

    it('se falhar, fica como não enviada, e tentar de novo usa o mesmo id', async () => {
      const send = vi.fn(() => Promise.reject(new Error('rede')));
      const { store, source } = setup({ send: send as ChatSource['send'] });
      await store.open('c1');
      await store.send('oi');
      const [failed] = store.pending();
      expect(failed).toMatchObject({ status: 'failed', reason: 'Não enviada.' });
      send.mockImplementation((() => {
        source.messages.mockResolvedValue([message('novo', failed.clientId, 1)]);
        return Promise.resolve('sent');
      }) as never);
      await store.retry(failed.clientId);
      expect(send).toHaveBeenLastCalledWith('c1', failed.clientId, 'oi');
      expect(store.pending()).toEqual([]);
    });

    it('recusa do servidor explica o motivo (CA10)', async () => {
      const { store } = setup({ send: () => Promise.resolve('rate_limited') });
      await store.open('c1');
      await store.send('oi');
      expect(store.pending()[0].reason).toContain('Muitas mensagens');
    });

    it('tentar de novo o que não existe não faz nada', async () => {
      const { store, source } = setup();
      await store.open('c1');
      await store.retry('nada');
      expect(source.send).not.toHaveBeenCalled();
    });

    it('sem conversa aberta, não envia', async () => {
      const { store, source } = setup();
      await store.send('oi');
      expect(source.send).not.toHaveBeenCalled();
    });

    it('resposta depois de trocar de conversa é ignorada', async () => {
      let finish: (value: 'rate_limited') => void = () => undefined;
      const { store } = setup({ send: () => new Promise((r) => (finish = r)) });
      await store.open('c1');
      const sending = store.send('oi');
      await store.open('c2');
      finish('rate_limited');
      await sending;
      expect(store.pending()).toEqual([]);
    });
  });

  describe('apagar (CA5)', () => {
    it('apaga e relê', async () => {
      const { store, source } = setup();
      await store.open('c1');
      source.messages.mockResolvedValue([{ ...message('a'), body: null, deleted: true }]);
      expect(await store.deleteMessage('a')).toBe(true);
      expect(store.messages()[0].deleted).toBe(true);
    });

    it('recusa devolve false', async () => {
      const { store } = setup({ deleteMessage: () => Promise.resolve(false) });
      await store.open('c1');
      expect(await store.deleteMessage('a')).toBe(false);
    });

    it('falha devolve false', async () => {
      const { store } = setup({ deleteMessage: () => Promise.reject(new Error('rede')) });
      await store.open('c1');
      expect(await store.deleteMessage('a')).toBe(false);
    });
  });
});
