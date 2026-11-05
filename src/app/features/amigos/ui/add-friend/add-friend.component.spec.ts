import { TestBed } from '@angular/core/testing';

import { Lookup } from '../../data/friends.store';
import { FoundPlayer, Relation } from '../../domain/friends';
import { AddFriendComponent } from './add-friend.component';

const found = (relation: Relation): FoundPlayer => ({
  id: 'rafa',
  name: 'Rafa',
  username: 'rafa_jogos',
  avatarUrl: null,
  relation,
});

async function render(lookup: Lookup = { status: 'idle' }) {
  const fixture = TestBed.createComponent(AddFriendComponent);
  fixture.componentRef.setInput('lookup', lookup);
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
  const element = fixture.nativeElement as HTMLElement;
  const button = (label: string) =>
    [...element.querySelectorAll('button')].find((b) => b.textContent?.includes(label));
  return { fixture, element, button };
}

describe('AddFriendComponent', () => {
  it('procura o que foi digitado (spec 006, CA3)', async () => {
    const { fixture, element } = await render();
    const searched: string[] = [];
    fixture.componentInstance.find.subscribe((text) => searched.push(text));
    const input = element.querySelector('input') as HTMLInputElement;
    input.value = '@rafa_jogos';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    element.querySelector('form')?.dispatchEvent(new Event('submit'));
    expect(searched).toEqual(['@rafa_jogos']);
  });

  it('campo vazio não procura', async () => {
    const { fixture, element } = await render();
    const searched: string[] = [];
    fixture.componentInstance.find.subscribe((text) => searched.push(text));
    element.querySelector('form')?.dispatchEvent(new Event('submit'));
    expect(searched).toEqual([]);
  });

  it('o campo tem rótulo (CA21)', async () => {
    const { element } = await render();
    expect(element.textContent).toContain('@usuário exato');
  });

  it('copia o convite (CA18)', async () => {
    const { fixture, button } = await render();
    let copied = 0;
    fixture.componentInstance.copyInvite.subscribe(() => (copied += 1));
    button('Copiar convite')?.click();
    expect(copied).toBe(1);
  });

  it('avisa quando não achou (CA4)', async () => {
    const { element } = await render({ status: 'not-found' });
    expect(element.querySelector('.add__message')?.textContent).toBe(
      'Não encontramos esse @usuário.',
    );
  });

  it('avisa quando a busca falhou, sem dizer que a pessoa não existe (CA19)', async () => {
    const { element } = await render({ status: 'error' });
    expect(element.querySelector('.add__message--error')?.textContent).toContain('Tente de novo');
  });

  it('pessoa nova: "Enviar pedido" (CA3)', async () => {
    const { fixture, button } = await render({ status: 'found', player: found('none') });
    const sent: FoundPlayer[] = [];
    fixture.componentInstance.send.subscribe((player) => sent.push(player));
    button('Enviar pedido')?.click();
    expect(sent.map((player) => player.id)).toEqual(['rafa']);
  });

  it('pedido recebido: "Aceitar pedido" (CA7)', async () => {
    const { fixture, button } = await render({ status: 'found', player: found('received') });
    const accepted: FoundPlayer[] = [];
    fixture.componentInstance.accept.subscribe((player) => accepted.push(player));
    button('Aceitar pedido')?.click();
    expect(accepted.map((player) => player.id)).toEqual(['rafa']);
  });

  it.each<[Relation, string]>([
    ['self', 'Esse é o seu @usuário.'],
    ['friend', 'Vocês já são amigos.'],
    ['sent', 'Pedido enviado.'],
    ['blocked', 'Você bloqueou esta pessoa.'],
  ])('%s: mostra o estado, sem botão de pedir (CA5, CA6)', async (relation, text) => {
    const { element, button } = await render({ status: 'found', player: found(relation) });
    expect(element.querySelector('.person__status')?.textContent).toBe(text);
    expect(button('Enviar pedido')).toBeUndefined();
  });
});
