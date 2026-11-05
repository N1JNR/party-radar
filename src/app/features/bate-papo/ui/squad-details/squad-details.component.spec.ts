import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Conversation, SquadMember } from '../../domain/chat';
import { SquadDetailsComponent } from './squad-details.component';

const member = (id: string, isOwner = false): SquadMember => ({
  id,
  name: id.toUpperCase(),
  username: id,
  avatarUrl: null,
  isOwner,
});

const squad = (isOwner: boolean): Conversation => ({
  id: 'c1',
  kind: 'squad',
  title: 'Squad da Sexta',
  avatarUrl: null,
  isOwner,
  memberCount: 2,
  canSend: true,
  lastBody: null,
  lastDeleted: false,
  lastSenderName: null,
  lastAt: null,
  unread: 0,
});

describe('SquadDetailsComponent', () => {
  let fixture: ComponentFixture<SquadDetailsComponent>;
  let element: HTMLElement;

  async function render(isOwner = true): Promise<void> {
    fixture = TestBed.createComponent(SquadDetailsComponent);
    fixture.componentRef.setInput('conversation', squad(isOwner));
    fixture.componentRef.setInput('members', [member('ana', true), member('bia')]);
    fixture.componentRef.setInput('friends', [
      { id: 'bia', name: 'BIA', username: 'bia', avatarUrl: null },
      { id: 'caio', name: 'CAIO', username: 'caio', avatarUrl: null },
    ]);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    element = fixture.nativeElement as HTMLElement;
  }

  const button = (label: string) =>
    [...element.querySelectorAll('button')].find(
      (b) => b.getAttribute('aria-label') === label || b.textContent?.trim() === label,
    );

  it('mostra os membros e quem é o dono (spec 007, CA13)', async () => {
    await render();
    expect(element.querySelector('h3')?.textContent).toBe('2 no squad');
    expect(element.querySelector('.person__status')?.textContent).toBe('Dono do squad');
  });

  it('o dono remove outra pessoa, mas não a si mesmo (CA13)', async () => {
    await render();
    const removed: SquadMember[] = [];
    fixture.componentInstance.remove.subscribe((item) => removed.push(item));
    expect(button('Remover ANA do squad')).toBeUndefined();
    button('Remover BIA do squad')?.click();
    expect(removed.map((item) => item.id)).toEqual(['bia']);
  });

  it('o dono só vê para adicionar quem ainda não está no squad (CA13)', async () => {
    await render();
    const added: string[] = [];
    fixture.componentInstance.add.subscribe((item) => added.push(item.id));
    expect(button('Adicionar BIA ao squad')).toBeUndefined();
    button('Adicionar CAIO ao squad')?.click();
    expect(added).toEqual(['caio']);
  });

  it('o dono renomeia (CA13)', async () => {
    await render();
    const names: string[] = [];
    fixture.componentInstance.rename.subscribe((name) => names.push(name));
    const input = element.querySelector('input') as HTMLInputElement;
    input.value = '  Novo  ';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    element.querySelector('form')?.dispatchEvent(new Event('submit'));
    expect(names).toEqual(['Novo']);
  });

  it('nome vazio explica e não renomeia (CA11)', async () => {
    await render();
    const names: string[] = [];
    fixture.componentInstance.rename.subscribe((name) => names.push(name));
    const input = element.querySelector('input') as HTMLInputElement;
    input.value = '   ';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    element.querySelector('form')?.dispatchEvent(new Event('submit'));
    fixture.detectChanges();
    expect(names).toEqual([]);
    expect(element.querySelector('.details__error')?.textContent).toBe('Dê um nome ao squad.');
  });

  it('quem não é dono não renomeia, adiciona nem remove (CA13)', async () => {
    await render(false);
    expect(element.querySelector('form')).toBeNull();
    expect(button('Remover BIA do squad')).toBeUndefined();
    expect(button('Adicionar CAIO ao squad')).toBeUndefined();
  });

  it('qualquer um pode sair e voltar à conversa (CA15)', async () => {
    await render(false);
    let left = 0;
    let closed = 0;
    fixture.componentInstance.leave.subscribe(() => (left += 1));
    fixture.componentInstance.closed.subscribe(() => (closed += 1));
    button('Sair do squad')?.click();
    button('Voltar à conversa')?.click();
    expect([left, closed]).toEqual([1, 1]);
  });
});
