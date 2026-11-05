import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PoNotificationService } from '@po-ui/ng-components';

import { AuthStore } from '../../../core/auth/auth.store';
import { ClipboardService } from '../../../core/platform/clipboard.service';
import { ExternalNavigation } from '../../../core/platform/external-navigation';
import { FRIENDS_SOURCE, FriendsSource } from '../data/friends.source';
import { FriendsData } from '../domain/friends';
import { FriendsPage, REFRESH_EVERY_MS } from './friends.page';

const person = (id: string, name = id) => ({ id, name, username: id, avatarUrl: null });

const homeData = (fields: Partial<FriendsData> = {}): FriendsData => ({
  friends: [
    { ...person('caio_fps', 'Caio'), playing: null },
    { ...person('bia_souls', 'Bia'), playing: 'Dota 2' },
  ],
  received: [person('gui_lobby', 'Gui')],
  sent: [person('nina_play', 'Nina')],
  blocked: [person('edu_bad', 'Edu')],
  ...fields,
});

describe('FriendsPage', () => {
  let fixture: ComponentFixture<FriendsPage>;
  let element: HTMLElement;
  let source: FriendsSource;
  let success: ReturnType<typeof vi.fn>;
  let information: ReturnType<typeof vi.fn>;
  let error: ReturnType<typeof vi.fn>;
  let copy: ReturnType<typeof vi.fn>;

  async function settle(): Promise<void> {
    await fixture.whenStable();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  async function render(overrides: Partial<FriendsSource> = {}, copied = true): Promise<void> {
    success = vi.fn();
    information = vi.fn();
    error = vi.fn();
    copy = vi.fn(() => Promise.resolve(copied));
    source = {
      load: vi.fn(() => Promise.resolve(homeData())),
      find: vi.fn(() => Promise.resolve(null)),
      send: vi.fn(() => Promise.resolve('sent' as const)),
      answer: vi.fn(() => Promise.resolve(true)),
      cancel: vi.fn(() => Promise.resolve()),
      remove: vi.fn(() => Promise.resolve()),
      block: vi.fn(() => Promise.resolve()),
      unblock: vi.fn(() => Promise.resolve()),
      ...overrides,
    };
    TestBed.configureTestingModule({
      providers: [
        { provide: FRIENDS_SOURCE, useValue: source },
        { provide: PoNotificationService, useValue: { success, information, error } },
        { provide: ClipboardService, useValue: { copy } },
        { provide: ExternalNavigation, useValue: { origin: () => 'http://localhost:4200' } },
        { provide: AuthStore, useValue: { user: () => ({ username: 'ana' }) } },
      ],
    });
    fixture = TestBed.createComponent(FriendsPage);
    element = fixture.nativeElement as HTMLElement;
    await settle();
  }

  const button = (label: string) =>
    [...element.querySelectorAll('button')].find(
      (b) => b.getAttribute('aria-label') === label || b.textContent?.trim() === label,
    );
  const names = (section: string) =>
    [...element.querySelectorAll(`section[aria-labelledby="${section}"] .person__name`)].map(
      (node) => node.textContent,
    );

  it('mostra amigos, com quem joga primeiro, e os pedidos (spec 006, CA12, CA13)', async () => {
    await render();
    expect(element.querySelector('h1')?.textContent).toBe('Amigos');
    expect(names('friends-title')).toEqual(['Bia', 'Caio']);
    expect(element.querySelector('.person__status')?.textContent).toBe('Jogando Dota 2 agora');
    expect(names('received-title')).toEqual(['Gui']);
    expect(names('sent-title')).toEqual(['Nina']);
    expect(names('blocked-title')).toEqual(['Edu']);
  });

  it('carregando, mostra o esqueleto e avisa o leitor de tela (CA19)', async () => {
    TestBed.configureTestingModule({
      providers: [
        { provide: FRIENDS_SOURCE, useValue: { load: () => new Promise(() => undefined) } },
        { provide: PoNotificationService, useValue: {} },
        { provide: ClipboardService, useValue: {} },
        { provide: ExternalNavigation, useValue: {} },
        { provide: AuthStore, useValue: {} },
      ],
    });
    fixture = TestBed.createComponent(FriendsPage);
    fixture.detectChanges();
    element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('.skeleton')).not.toBeNull();
    expect(element.querySelector('[role="status"]')?.textContent).toContain('Carregando');
  });

  it('erro mostra "Tentar de novo", que carrega de novo (CA19)', async () => {
    const load = vi.fn(() => Promise.reject(new Error('rede')));
    await render({ load: load as FriendsSource['load'] });
    expect(element.querySelector('[role="alert"]')?.textContent).toContain('Não foi possível');
    (load as ReturnType<typeof vi.fn>).mockResolvedValue(homeData());
    button('Tentar de novo')?.click();
    await settle();
    expect(names('friends-title')).toEqual(['Bia', 'Caio']);
  });

  it('sem amigos, explica como convidar e esconde as seções vazias (CA18)', async () => {
    await render({
      load: () => Promise.resolve({ friends: [], received: [], sent: [], blocked: [] }),
    });
    expect(element.textContent).toContain('Você ainda não tem amigos por aqui.');
    expect(button('Copiar convite')).toBeDefined();
    expect(element.querySelector('section[aria-labelledby="received-title"]')).toBeNull();
    expect(element.querySelector('section[aria-labelledby="sent-title"]')).toBeNull();
    expect(element.querySelector('section[aria-labelledby="blocked-title"]')).toBeNull();
  });

  it('copia o convite com o @usuário de quem está logado (CA18)', async () => {
    await render();
    button('Copiar convite')?.click();
    await settle();
    expect(copy).toHaveBeenCalledWith('http://localhost:4200/convite/ana');
    expect(success).toHaveBeenCalledWith('Link de convite copiado.');
  });

  it('sem poder copiar, mostra o link (CA18)', async () => {
    await render({}, false);
    button('Copiar convite')?.click();
    await settle();
    expect(information).toHaveBeenCalledWith(
      'Não deu para copiar. Seu link de convite: http://localhost:4200/convite/ana',
    );
  });

  it('aceita um pedido (CA8)', async () => {
    await render();
    button('Aceitar o pedido de Gui')?.click();
    await settle();
    expect(source.answer).toHaveBeenCalledWith('gui_lobby', true);
    expect(success).toHaveBeenCalledWith('Agora você e Gui são amigos.');
  });

  it('recusa um pedido (CA9)', async () => {
    await render();
    button('Recusar o pedido de Gui')?.click();
    await settle();
    expect(source.answer).toHaveBeenCalledWith('gui_lobby', false);
    expect(information).toHaveBeenCalledWith('Pedido recusado.');
  });

  it('cancela um pedido enviado (CA10)', async () => {
    await render();
    button('Cancelar o pedido para Nina')?.click();
    await settle();
    expect(source.cancel).toHaveBeenCalledWith('nina_play');
  });

  it('desbloqueia (CA17)', async () => {
    await render();
    button('Desbloquear Edu')?.click();
    await settle();
    expect(source.unblock).toHaveBeenCalledWith('edu_bad');
    expect(information).toHaveBeenCalledWith('Você desbloqueou Edu.');
  });

  it('remover só acontece depois de confirmar (CA15)', async () => {
    await render();
    button('Remover Bia')?.click();
    await settle();
    expect(source.remove).not.toHaveBeenCalled();
    expect(document.body.textContent + (element.textContent ?? '')).toContain('Remover Bia?');
    button('Confirmar')?.click();
    await settle();
    expect(source.remove).toHaveBeenCalledWith('bia_souls');
    expect(information).toHaveBeenCalledWith('Você removeu Bia.');
  });

  it('cancelar a confirmação não remove (CA15)', async () => {
    await render();
    button('Remover Bia')?.click();
    await settle();
    button('Cancelar')?.click();
    await settle();
    expect(source.remove).not.toHaveBeenCalled();
  });

  it('bloquear pede confirmação e explica que a pessoa não é avisada (CA16)', async () => {
    await render();
    button('Bloquear Bia')?.click();
    await settle();
    expect(element.textContent).toContain('Bloquear Bia?');
    expect(element.textContent).toContain('Ela não será avisada.');
    button('Confirmar')?.click();
    await settle();
    expect(source.block).toHaveBeenCalledWith('bia_souls');
    expect(information).toHaveBeenCalledWith('Você bloqueou Bia.');
  });

  it.each([
    ['Aceitar o pedido de Gui', { answer: () => Promise.reject(new Error('rede')) }],
    ['Cancelar o pedido para Nina', { cancel: () => Promise.reject(new Error('rede')) }],
    ['Desbloquear Edu', { unblock: () => Promise.reject(new Error('rede')) }],
  ])('se "%s" falhar, avisa e a lista não muda (CA19)', async (label, overrides) => {
    await render(overrides);
    button(label)?.click();
    await settle();
    expect(error).toHaveBeenCalledWith('Não foi possível concluir. Tente de novo.');
    expect(names('friends-title')).toEqual(['Bia', 'Caio']);
  });

  it('se remover falhar, avisa (CA19)', async () => {
    await render({ remove: () => Promise.reject(new Error('rede')) });
    button('Remover Bia')?.click();
    await settle();
    button('Confirmar')?.click();
    await settle();
    expect(error).toHaveBeenCalledWith('Não foi possível concluir. Tente de novo.');
  });

  describe('adicionar', () => {
    const found = { ...person('rafa_jogos', 'Rafa') };

    async function search(): Promise<void> {
      const input = element.querySelector('app-add-friend input') as HTMLInputElement;
      input.value = 'rafa_jogos';
      input.dispatchEvent(new Event('input'));
      fixture.detectChanges();
      element.querySelector('form')?.dispatchEvent(new Event('submit'));
      await settle();
    }

    it('procura, envia o pedido e avisa (CA3)', async () => {
      await render({ find: () => Promise.resolve({ ...found, relation: 'none' }) });
      await search();
      button('Enviar pedido')?.click();
      await settle();
      expect(source.send).toHaveBeenCalledWith('rafa_jogos');
      expect(success).toHaveBeenCalledWith('Pedido enviado para Rafa.');
    });

    it('avisa sem sucesso quando o pedido já não cabe (CA11)', async () => {
      await render({
        find: () => Promise.resolve({ ...found, relation: 'none' }),
        send: () => Promise.resolve('limit'),
      });
      await search();
      button('Enviar pedido')?.click();
      await settle();
      expect(information).toHaveBeenCalledWith(
        'Você já tem 20 pedidos abertos. Espere uma resposta ou cancele algum.',
      );
    });

    it('se o pedido falhar, avisa (CA19)', async () => {
      await render({
        find: () => Promise.resolve({ ...found, relation: 'none' }),
        send: () => Promise.reject(new Error('rede')),
      });
      await search();
      button('Enviar pedido')?.click();
      await settle();
      expect(error).toHaveBeenCalledWith('Não foi possível concluir. Tente de novo.');
    });

    it('aceita pela busca e limpa o resultado (CA7)', async () => {
      await render({ find: () => Promise.resolve({ ...found, relation: 'received' }) });
      await search();
      button('Aceitar pedido')?.click();
      await settle();
      expect(source.answer).toHaveBeenCalledWith('rafa_jogos', true);
      expect(element.querySelector('app-add-friend .person__name')).toBeNull();
    });
  });

  it('relê a cada minuto, sem o carregando (CA13)', async () => {
    vi.useFakeTimers();
    try {
      await render();
      TestBed.tick();
      const before = (source.load as ReturnType<typeof vi.fn>).mock.calls.length;
      await vi.advanceTimersByTimeAsync(REFRESH_EVERY_MS);
      expect((source.load as ReturnType<typeof vi.fn>).mock.calls.length).toBe(before + 1);
      expect(element.querySelector('.skeleton')).toBeNull();
      fixture.destroy();
    } finally {
      vi.useRealTimers();
    }
  });
});
