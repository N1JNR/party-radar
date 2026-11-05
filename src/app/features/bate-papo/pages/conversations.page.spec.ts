import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { PoNotificationService } from '@po-ui/ng-components';

import { FRIENDS_SOURCE } from '../../amigos/data/friends.source';
import { CHAT_SOURCE, ChatSource } from '../data/chat.source';
import { ChatStore } from '../data/chat.store';
import { ChatMessage, Conversation, SquadMember } from '../domain/chat';
import { ConversationsPage } from './conversations.page';

const conversation = (id: string, fields: Partial<Conversation> = {}): Conversation => ({
  id,
  kind: 'direct',
  title: `Conversa ${id}`,
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

const message = (id: string, fields: Partial<ChatMessage> = {}): ChatMessage => ({
  id,
  clientId: id,
  senderId: 'me',
  senderName: 'Eu',
  senderAvatarUrl: null,
  body: `texto ${id}`,
  createdAt: '2026-11-05T12:00:00Z',
  deleted: false,
  mine: true,
  ...fields,
});

const member = (id: string, isOwner = false): SquadMember => ({
  id,
  name: id,
  username: id,
  avatarUrl: null,
  isOwner,
});

describe('ConversationsPage', () => {
  let fixture: ComponentFixture<ConversationsPage>;
  let element: HTMLElement;
  let source: Record<keyof ChatSource, ReturnType<typeof vi.fn>>;
  let error: ReturnType<typeof vi.fn>;
  let information: ReturnType<typeof vi.fn>;
  let router: Router;
  /** Quando definido, é a resposta da lista de amigos. */
  let friendsLoad: Promise<unknown> | undefined;

  beforeEach(() => {
    friendsLoad = undefined;
  });

  async function settle(): Promise<void> {
    for (let i = 0; i < 3; i++) {
      await fixture.whenStable();
      fixture.detectChanges();
    }
  }

  async function render(
    id: string | undefined,
    overrides: Partial<Record<keyof ChatSource, ReturnType<typeof vi.fn>>> = {},
    start = true,
  ): Promise<void> {
    error = vi.fn();
    information = vi.fn();
    source = {
      conversations: vi.fn(() => Promise.resolve([conversation('c1')])),
      messages: vi.fn(() => Promise.resolve([message('m1')])),
      send: vi.fn(() => Promise.resolve('sent')),
      deleteMessage: vi.fn(() => Promise.resolve(true)),
      markRead: vi.fn(() => Promise.resolve()),
      openDirect: vi.fn(() => Promise.resolve('c1')),
      createSquad: vi.fn(() => Promise.resolve({ status: 'created', id: 's1' })),
      renameSquad: vi.fn(() => Promise.resolve(true)),
      addMember: vi.fn(() => Promise.resolve('added')),
      removeMember: vi.fn(() => Promise.resolve(true)),
      leaveSquad: vi.fn(() => Promise.resolve()),
      squadMembers: vi.fn(() => Promise.resolve([member('ana', true), member('bia')])),
      subscribe: vi.fn(() => () => undefined),
      ...overrides,
    };
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: CHAT_SOURCE, useValue: source },
        {
          provide: FRIENDS_SOURCE,
          useValue: {
            load: () =>
              friendsLoad ??
              Promise.resolve({
                friends: [
                  { id: 'bia', name: 'Bia', username: 'bia', avatarUrl: null, playing: null },
                  { id: 'caio', name: 'Caio', username: 'caio', avatarUrl: null, playing: null },
                ],
                received: [],
                sent: [],
                blocked: [],
              }),
          },
        },
        { provide: PoNotificationService, useValue: { error, information, success: vi.fn() } },
      ],
    });
    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
    vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    if (start) {
      await TestBed.inject(ChatStore).load();
    }
    fixture = TestBed.createComponent(ConversationsPage);
    if (id) {
      fixture.componentRef.setInput('id', id);
    }
    element = fixture.nativeElement as HTMLElement;
    fixture.detectChanges();
    await settle();
  }

  const button = (label: string) =>
    [...element.querySelectorAll('button')].find(
      (b) => b.getAttribute('aria-label') === label || b.textContent?.trim() === label,
    );
  const modalButton = (label: string) =>
    [...element.querySelectorAll<HTMLButtonElement>('po-modal button')].find(
      (b) => b.textContent?.trim() === label,
    );

  afterEach(() => vi.restoreAllMocks());

  describe('lista', () => {
    it('mostra as conversas e o aviso de privacidade (spec 007, CA19)', async () => {
      await render(undefined);
      expect(element.querySelector('h1')?.textContent).toBe('Conversas');
      expect(element.querySelector('.row__title')?.textContent).toBe('Conversa c1');
      expect(element.querySelector('.chat__privacy')?.textContent).toContain(
        'sem criptografia de ponta a ponta',
      );
      expect(element.textContent).toContain('Escolha uma conversa para começar.');
    });

    it('sem conversas, convida a falar com um amigo (CA21)', async () => {
      await render(undefined, { conversations: vi.fn(() => Promise.resolve([])) });
      expect(element.textContent).toContain('Nenhuma conversa ainda.');
      expect(element.querySelector('.chat__link')?.getAttribute('href')).toBe('/amigos');
    });

    it('carregando, mostra o esqueleto e avisa o leitor de tela (CA22)', async () => {
      await render(undefined, {}, false);
      expect(element.querySelector('.skeleton')).not.toBeNull();
      expect(element.querySelector('[role="status"]')?.textContent).toContain('Carregando');
    });

    it('erro mostra "Tentar de novo", que carrega de novo (CA22)', async () => {
      const conversations = vi.fn(() => Promise.reject(new Error('rede')));
      await render(undefined, { conversations });
      expect(element.querySelector('[role="alert"]')?.textContent).toContain('Não foi possível');
      conversations.mockResolvedValue([conversation('c1')] as never);
      button('Tentar de novo')?.click();
      await settle();
      expect(element.querySelector('.row__title')).not.toBeNull();
    });
  });

  describe('conversa', () => {
    it('abre a conversa da rota e mostra as mensagens (CA3)', async () => {
      await render('c1');
      expect(source.messages).toHaveBeenCalledWith('c1');
      expect(element.querySelector('.chat__name')?.textContent).toBe('Conversa c1');
      expect(element.querySelector('.message__body')?.textContent).toBe('texto m1');
      expect(source.markRead).toHaveBeenCalledWith('c1');
    });

    it('abrir zera as não lidas na lista e no menu (CA18)', async () => {
      const conversations = vi.fn(() =>
        Promise.resolve([conversation('c1', { unread: read ? 0 : 2 })]),
      );
      let read = false;
      await render('c1', {
        conversations,
        markRead: vi.fn(() => {
          read = true;
          return Promise.resolve();
        }),
      });
      await settle();
      expect(TestBed.inject(ChatStore).withNews()).toBe(0);
      expect(element.querySelector('.row__unread')).toBeNull();
    });

    it('mensagem nova na conversa aberta já conta como lida (CA18)', async () => {
      let notify: () => void = () => undefined;
      let read = true;
      await render('c1', {
        conversations: vi.fn(() => Promise.resolve([conversation('c1', { unread: read ? 0 : 1 })])),
        markRead: vi.fn(() => {
          read = true;
          return Promise.resolve();
        }),
        subscribe: vi.fn((listener: () => void) => {
          notify = listener;
          return () => undefined;
        }),
      });
      await settle();
      TestBed.inject(ChatStore).start();
      read = false;
      notify();
      await settle();
      expect(TestBed.inject(ChatStore).withNews()).toBe(0);
      TestBed.inject(ChatStore).stop();
    });

    it('no celular, marca que a segunda tela está aberta (CA25)', async () => {
      await render('c1');
      expect(element.querySelector('.chat--pane-open')).not.toBeNull();
      expect(element.querySelector('.chat__back')?.getAttribute('href')).toBe('/conversas');
    });

    it('sem conversa, a segunda tela fica fechada (CA25)', async () => {
      await render(undefined);
      expect(element.querySelector('.chat--pane-open')).toBeNull();
    });

    it('enquanto abre, mostra o esqueleto (CA22)', async () => {
      await render('c1', { messages: vi.fn(() => new Promise(() => undefined)) });
      expect(element.querySelector('.skeleton--messages')).not.toBeNull();
    });

    it('erro mostra "Tentar de novo", que abre de novo (CA22)', async () => {
      const messages = vi.fn(() => Promise.reject(new Error('rede')));
      await render('c1', { messages });
      expect(element.querySelector('.chat__pane [role="alert"]')?.textContent).toContain(
        'Não foi possível abrir',
      );
      messages.mockResolvedValue([message('m1')] as never);
      button('Tentar de novo')?.click();
      await settle();
      expect(element.querySelector('.message__body')).not.toBeNull();
    });

    it('conversa que não está na lista avisa (CA15)', async () => {
      await render('sumiu');
      expect(element.textContent).toContain('Esta conversa não está disponível.');
      expect(element.querySelector('app-message-composer')).toBeNull();
    });

    it('só para leitura: sem caixa de texto, com o motivo neutro (CA20)', async () => {
      await render('c1', {
        conversations: vi.fn(() => Promise.resolve([conversation('c1', { canSend: false })])),
      });
      expect(element.querySelector('app-message-composer')).toBeNull();
      expect(element.querySelector('.chat__readonly')?.textContent).toBe(
        'Não é possível enviar mensagens nesta conversa.',
      );
    });

    it('envia e relê (CA3)', async () => {
      await render('c1');
      const area = element.querySelector('textarea') as HTMLTextAreaElement;
      area.value = 'oi';
      area.dispatchEvent(new Event('input'));
      fixture.detectChanges();
      element.querySelector('app-message-composer form')?.dispatchEvent(new Event('submit'));
      await settle();
      expect(source.send).toHaveBeenCalledWith('c1', expect.any(String), 'oi');
    });

    it('uma novidade do tempo real relê a conversa aberta (CA3)', async () => {
      let notify: () => void = () => undefined;
      await render('c1', {
        subscribe: vi.fn((listener: () => void) => {
          notify = listener;
          return () => undefined;
        }),
      });
      TestBed.inject(ChatStore).start();
      source.messages.mockResolvedValue([message('m1'), message('m2')]);
      notify();
      await settle();
      expect(element.querySelectorAll('.message__body')).toHaveLength(2);
      TestBed.inject(ChatStore).stop();
    });

    it('apagar só acontece depois de confirmar (CA5)', async () => {
      await render('c1');
      button('Apagar esta mensagem')?.click();
      await settle();
      expect(source.deleteMessage).not.toHaveBeenCalled();
      expect(element.textContent).toContain('Apagar esta mensagem?');
      modalButton('Apagar')?.click();
      await settle();
      expect(source.deleteMessage).toHaveBeenCalledWith('m1');
    });

    it('depois de apagar, o foco vai para as mensagens (CA24)', async () => {
      let deleted = false;
      await render('c1', {
        messages: vi.fn(() => Promise.resolve([message('m1', { deleted, body: null })])),
        deleteMessage: vi.fn(() => {
          deleted = true;
          return Promise.resolve(true);
        }),
      });
      document.body.appendChild(element);
      button('Apagar esta mensagem')?.click();
      await settle();
      modalButton('Apagar')?.click();
      await settle();
      expect(document.activeElement).toBe(element.querySelector('.messages'));
      element.remove();
    });

    it('cancelar a confirmação não apaga (CA5)', async () => {
      await render('c1');
      button('Apagar esta mensagem')?.click();
      await settle();
      modalButton('Cancelar')?.click();
      await settle();
      expect(source.deleteMessage).not.toHaveBeenCalled();
    });

    it('se apagar falhar, avisa (CA5)', async () => {
      await render('c1', { deleteMessage: vi.fn(() => Promise.reject(new Error('rede'))) });
      button('Apagar esta mensagem')?.click();
      await settle();
      modalButton('Apagar')?.click();
      await settle();
      expect(error).toHaveBeenCalledWith('Não foi possível concluir. Tente de novo.');
    });

    it('trocar a rota fecha a conversa', async () => {
      await render('c1');
      fixture.componentRef.setInput('id', undefined);
      await settle();
      expect(element.querySelector('.message__body')).toBeNull();
    });
  });

  describe('criar squad', () => {
    async function openForm(overrides = {}): Promise<void> {
      await render(undefined, overrides);
      button('Criar squad')?.click();
      await settle();
    }

    async function fill(): Promise<void> {
      const input = element.querySelector('app-squad-form po-input input') as HTMLInputElement;
      input.value = 'Squad da Sexta';
      input.dispatchEvent(new Event('input'));
      fixture.detectChanges();
      (element.querySelector('po-checkbox .po-checkbox') as HTMLElement).click();
      await settle();
      element.querySelector('app-squad-form form')?.dispatchEvent(new Event('submit'));
      await settle();
    }

    it('enquanto os amigos carregam, não afirma que não há amigos (CA22)', async () => {
      friendsLoad = new Promise(() => undefined);
      await openForm();
      expect(element.querySelector('app-squad-form')).toBeNull();
      expect(element.querySelector('.chat__pane .skeleton')).not.toBeNull();
    });

    it('se os amigos não carregarem, avisa e deixa tentar de novo ou voltar (CA22)', async () => {
      friendsLoad = Promise.reject(new Error('rede'));
      await openForm();
      expect(element.querySelector('app-squad-form')).toBeNull();
      expect(element.querySelector('.chat__pane [role="alert"]')?.textContent).toContain(
        'Não foi possível carregar seus amigos.',
      );
      friendsLoad = undefined;
      button('Tentar de novo')?.click();
      await settle();
      expect(element.querySelector('app-squad-form')).not.toBeNull();
    });

    it('com erro nos amigos, Voltar fecha o painel', async () => {
      friendsLoad = Promise.reject(new Error('rede'));
      await openForm();
      button('Voltar')?.click();
      await settle();
      expect(element.querySelector('.chat__pane [role="alert"]')).toBeNull();
    });

    it('abre o formulário com os amigos (CA11)', async () => {
      await openForm();
      expect(element.querySelector('.chat--pane-open')).not.toBeNull();
      expect(element.querySelector('app-squad-form')?.textContent).toContain('Bia');
    });

    it('cria e abre o squad (CA11)', async () => {
      await openForm();
      await fill();
      expect(source.createSquad).toHaveBeenCalledWith('Squad da Sexta', ['bia']);
      expect(router.navigate).toHaveBeenCalledWith(['/conversas'], {
        queryParams: { id: 's1' },
      });
    });

    it('recusa do servidor aparece no formulário (CA14)', async () => {
      await openForm({
        createSquad: vi.fn(() => Promise.resolve({ status: 'full', id: null })),
      });
      await fill();
      expect(element.querySelector('.form__error')?.textContent).toBe(
        'Um squad pode ter até 50 pessoas.',
      );
    });

    it('falha aparece no formulário (CA22)', async () => {
      await openForm({ createSquad: vi.fn(() => Promise.reject(new Error('rede'))) });
      await fill();
      expect(element.querySelector('.form__error')?.textContent).toBe(
        'Não foi possível concluir. Tente de novo.',
      );
    });

    it('resposta sem id conta como falha', async () => {
      await openForm({
        createSquad: vi.fn(() => Promise.resolve({ status: 'created', id: null })),
      });
      await fill();
      expect(element.querySelector('.form__error')?.textContent).toBe(
        'Não foi possível concluir. Tente de novo.',
      );
    });

    it('cancelar volta', async () => {
      await openForm();
      button('Cancelar')?.click();
      await settle();
      expect(element.querySelector('app-squad-form')).toBeNull();
    });
  });

  describe('squad', () => {
    const squad = conversation('s1', { kind: 'squad', title: 'Squad', isOwner: true });

    async function openDetails(overrides = {}): Promise<void> {
      await render('s1', { conversations: vi.fn(() => Promise.resolve([squad])), ...overrides });
      button('Ver squad')?.click();
      await settle();
    }

    it('conversa a dois não tem "Ver squad"', async () => {
      await render('c1');
      expect(button('Ver squad')).toBeUndefined();
    });

    it('mostra os membros e volta à conversa (CA13)', async () => {
      await openDetails();
      expect(source.squadMembers).toHaveBeenCalledWith('s1');
      expect(element.querySelector('app-squad-details h3')?.textContent).toBe('2 no squad');
      button('Voltar à conversa')?.click();
      await settle();
      expect(element.querySelector('app-squad-details')).toBeNull();
    });

    it('avisa se não der para ler os membros', async () => {
      await openDetails({ squadMembers: vi.fn(() => Promise.reject(new Error('rede'))) });
      expect(error).toHaveBeenCalledWith('Não foi possível concluir. Tente de novo.');
    });

    it('adiciona um amigo e relê (CA13)', async () => {
      await openDetails();
      button('Adicionar Caio ao squad')?.click();
      await settle();
      expect(source.addMember).toHaveBeenCalledWith('s1', 'caio');
      expect(source.squadMembers).toHaveBeenCalledTimes(2);
    });

    it('squad cheio avisa (CA14)', async () => {
      await openDetails({ addMember: vi.fn(() => Promise.resolve('full')) });
      button('Adicionar Caio ao squad')?.click();
      await settle();
      expect(information).toHaveBeenCalledWith('Este squad está cheio: são 50 pessoas no máximo.');
    });

    it('se a ação falhar, avisa (CA22)', async () => {
      await openDetails({ addMember: vi.fn(() => Promise.reject(new Error('rede'))) });
      button('Adicionar Caio ao squad')?.click();
      await settle();
      expect(error).toHaveBeenCalledWith('Não foi possível concluir. Tente de novo.');
    });

    it('renomeia (CA13)', async () => {
      await openDetails();
      element.querySelector('app-squad-details form')?.dispatchEvent(new Event('submit'));
      await settle();
      expect(source.renameSquad).toHaveBeenCalledWith('s1', 'Squad');
    });

    it('renomear recusado avisa', async () => {
      await openDetails({ renameSquad: vi.fn(() => Promise.resolve(false)) });
      element.querySelector('app-squad-details form')?.dispatchEvent(new Event('submit'));
      await settle();
      expect(error).toHaveBeenCalled();
    });

    it('remover pede confirmação (CA13)', async () => {
      await openDetails();
      button('Remover bia do squad')?.click();
      await settle();
      expect(source.removeMember).not.toHaveBeenCalled();
      expect(element.textContent).toContain('Remover bia do squad?');
      modalButton('Remover')?.click();
      await settle();
      expect(source.removeMember).toHaveBeenCalledWith('s1', 'bia');
    });

    it('remover recusado avisa', async () => {
      await openDetails({ removeMember: vi.fn(() => Promise.resolve(false)) });
      button('Remover bia do squad')?.click();
      await settle();
      modalButton('Remover')?.click();
      await settle();
      expect(error).toHaveBeenCalled();
    });

    it('sair pede confirmação e volta para a lista (CA15)', async () => {
      await openDetails();
      button('Sair do squad')?.click();
      await settle();
      expect(element.textContent).toContain('o squad e as mensagens são apagados');
      modalButton('Sair')?.click();
      await settle();
      expect(source.leaveSquad).toHaveBeenCalledWith('s1');
      expect(router.navigateByUrl).toHaveBeenCalledWith('/conversas');
    });

    it('se sair falhar, avisa e fica', async () => {
      await openDetails({ leaveSquad: vi.fn(() => Promise.reject(new Error('rede'))) });
      button('Sair do squad')?.click();
      await settle();
      modalButton('Sair')?.click();
      await settle();
      expect(error).toHaveBeenCalled();
      expect(router.navigateByUrl).not.toHaveBeenCalled();
    });
  });
});
