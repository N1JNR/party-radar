import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { PoNotificationService } from '@po-ui/ng-components';

import { FRIENDS_SOURCE, FriendsSource } from '../data/friends.source';
import { FoundPlayer, Relation } from '../domain/friends';
import { InvitePage } from './invite.page';

const found = (relation: Relation): FoundPlayer => ({
  id: 'ana_id',
  name: 'Ana',
  username: 'ana',
  avatarUrl: null,
  relation,
});

describe('InvitePage', () => {
  let fixture: ComponentFixture<InvitePage>;
  let element: HTMLElement;
  let source: FriendsSource;
  let success: ReturnType<typeof vi.fn>;
  let information: ReturnType<typeof vi.fn>;
  let error: ReturnType<typeof vi.fn>;

  async function settle(): Promise<void> {
    await fixture.whenStable();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  async function render(overrides: Partial<FriendsSource> = {}): Promise<void> {
    success = vi.fn();
    information = vi.fn();
    error = vi.fn();
    source = {
      load: vi.fn(() => Promise.resolve({ friends: [], received: [], sent: [], blocked: [] })),
      find: vi.fn(() => Promise.resolve(found('none'))),
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
        provideRouter([]),
        { provide: FRIENDS_SOURCE, useValue: source },
        { provide: PoNotificationService, useValue: { success, information, error } },
      ],
    });
    fixture = TestBed.createComponent(InvitePage);
    fixture.componentRef.setInput('username', 'ana');
    element = fixture.nativeElement as HTMLElement;
    fixture.detectChanges();
    await settle();
  }

  const button = (label: string) =>
    [...element.querySelectorAll('button')].find((b) => b.textContent?.includes(label));

  it('mostra quem convidou e deixa enviar o pedido (spec 006, CA1)', async () => {
    await render();
    expect(source.find).toHaveBeenCalledWith('ana');
    expect(element.querySelector('.person__name')?.textContent).toBe('Ana');
    button('Enviar pedido')?.click();
    await settle();
    expect(source.send).toHaveBeenCalledWith('ana_id');
    expect(success).toHaveBeenCalledWith('Pedido enviado para Ana.');
  });

  it('enquanto abre, avisa o leitor de tela', async () => {
    await render({ find: () => new Promise(() => undefined) });
    expect(element.querySelector('[role="status"]')?.textContent).toContain('Abrindo');
  });

  it('o próprio convite não deixa adicionar (CA5)', async () => {
    await render({ find: () => Promise.resolve(found('self')) });
    expect(button('Enviar pedido')).toBeUndefined();
    expect(element.textContent).toContain('Este é o seu convite.');
  });

  it.each<[Relation, string]>([
    ['friend', 'Vocês já são amigos.'],
    ['sent', 'Pedido enviado.'],
    ['blocked', 'Você bloqueou esta pessoa.'],
  ])('%s: mostra o estado, sem pedido novo (CA6)', async (relation, text) => {
    await render({ find: () => Promise.resolve(found(relation)) });
    expect(element.querySelector('.person__status')?.textContent).toBe(text);
    expect(button('Enviar pedido')).toBeUndefined();
  });

  it('quem já pediu pode ser aceito pelo convite (CA7)', async () => {
    await render({ find: () => Promise.resolve(found('received')) });
    button('Aceitar pedido')?.click();
    await settle();
    expect(source.answer).toHaveBeenCalledWith('ana_id', true);
    expect(success).toHaveBeenCalledWith('Agora você e Ana são amigos.');
  });

  it('pedido que a outra pessoa cancelou avisa e atualiza o convite (CA8, CA10)', async () => {
    const find = vi.fn(() => Promise.resolve(found('received')));
    await render({ find, answer: () => Promise.resolve(false) });
    find.mockResolvedValue(found('none'));
    button('Aceitar pedido')?.click();
    await settle();
    expect(information).toHaveBeenCalledWith('Esse pedido não está mais aberto.');
    expect(success).not.toHaveBeenCalled();
    expect(button('Enviar pedido')).toBeDefined();
  });

  it('se aceitar falhar, avisa (CA19)', async () => {
    await render({
      find: () => Promise.resolve(found('received')),
      answer: () => Promise.reject(new Error('rede')),
    });
    button('Aceitar pedido')?.click();
    await settle();
    expect(error).toHaveBeenCalledWith('Não foi possível concluir. Tente de novo.');
  });

  it('convite de quem não existe ou me bloqueou (CA4)', async () => {
    await render({ find: () => Promise.resolve(null) });
    expect(element.textContent).toContain('Não encontramos esse @usuário.');
    expect(button('Enviar pedido')).toBeUndefined();
  });

  it('erro mostra "Tentar de novo", que procura de novo (CA19)', async () => {
    const find = vi.fn(() => Promise.reject(new Error('rede')));
    await render({ find: find as FriendsSource['find'] });
    expect(element.querySelector('[role="alert"]')).not.toBeNull();
    (find as ReturnType<typeof vi.fn>).mockResolvedValue(found('none'));
    button('Tentar de novo')?.click();
    await settle();
    expect(button('Enviar pedido')).toBeDefined();
  });

  it('avisa quando o pedido não cabe mais (CA11)', async () => {
    await render({ send: () => Promise.resolve('limit') });
    button('Enviar pedido')?.click();
    await settle();
    expect(information).toHaveBeenCalledWith(
      'Você já tem 20 pedidos abertos. Espere uma resposta ou cancele algum.',
    );
  });

  it('se o pedido falhar, avisa (CA19)', async () => {
    await render({ send: () => Promise.reject(new Error('rede')) });
    button('Enviar pedido')?.click();
    await settle();
    expect(error).toHaveBeenCalledWith('Não foi possível concluir. Tente de novo.');
  });

  it('leva à lista de amigos', async () => {
    await render();
    expect(element.querySelector('a')?.getAttribute('href')).toBe('/amigos');
  });
});
