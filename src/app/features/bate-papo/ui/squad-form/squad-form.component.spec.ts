import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NewSquad, SquadFormComponent } from './squad-form.component';

const friend = (id: string) => ({ id, name: id.toUpperCase(), username: id, avatarUrl: null });

describe('SquadFormComponent', () => {
  let fixture: ComponentFixture<SquadFormComponent>;
  let element: HTMLElement;
  let created: NewSquad[];

  async function render(friends = [friend('bia'), friend('caio')]): Promise<void> {
    fixture = TestBed.createComponent(SquadFormComponent);
    fixture.componentRef.setInput('friends', friends);
    fixture.detectChanges();
    await settle();
    element = fixture.nativeElement as HTMLElement;
    created = [];
    fixture.componentInstance.create.subscribe((squad) => created.push(squad));
  }

  async function settle(): Promise<void> {
    await fixture.whenStable();
    fixture.detectChanges();
  }

  async function typeName(name: string): Promise<void> {
    const input = element.querySelector('input[type="text"], po-input input') as HTMLInputElement;
    input.value = name;
    input.dispatchEvent(new Event('input'));
    await settle();
  }

  async function choose(index: number): Promise<void> {
    (element.querySelectorAll('po-checkbox .po-checkbox')[index] as HTMLElement).click();
    await settle();
  }

  const submit = async () => {
    element.querySelector('form')?.dispatchEvent(new Event('submit'));
    await settle();
  };

  it('cria com o nome e os amigos escolhidos (spec 007, CA11)', async () => {
    await render();
    await typeName('  Squad da Sexta  ');
    await choose(1);
    await submit();
    expect(created).toEqual([{ name: 'Squad da Sexta', memberIds: ['caio'] }]);
  });

  it('desmarcar tira o amigo', async () => {
    await render();
    await typeName('Squad');
    await choose(0);
    await choose(1);
    await choose(0);
    await submit();
    expect(created[0].memberIds).toEqual(['caio']);
  });

  it('sem nome, explica e não cria (CA11)', async () => {
    await render();
    await choose(0);
    await submit();
    expect(created).toEqual([]);
    expect(element.querySelector('.form__error')?.textContent).toBe('Dê um nome ao squad.');
  });

  it('sem amigos escolhidos, explica e não cria (CA11)', async () => {
    await render();
    await typeName('Squad');
    await submit();
    expect(created).toEqual([]);
    expect(element.querySelector('.form__error')?.textContent).toBe('Escolha pelo menos um amigo.');
  });

  it('o aviso some ao corrigir o nome ou escolher um amigo', async () => {
    await render();
    await submit();
    expect(element.querySelector('.form__error')).not.toBeNull();
    await typeName('Squad');
    expect(element.querySelector('.form__error')).toBeNull();
    await submit();
    expect(element.querySelector('.form__error')).not.toBeNull();
    await choose(0);
    expect(element.querySelector('.form__error')).toBeNull();
  });

  it('mostra a recusa do servidor', async () => {
    await render();
    fixture.componentRef.setInput('failure', 'Um squad pode ter até 50 pessoas.');
    await settle();
    expect(element.querySelector('.form__error')?.textContent).toBe(
      'Um squad pode ter até 50 pessoas.',
    );
  });

  it('sem amigos, explica e deixa voltar (CA21)', async () => {
    await render([]);
    let cancelled = 0;
    fixture.componentInstance.cancelled.subscribe(() => (cancelled += 1));
    expect(element.textContent).toContain('Você precisa de amigos para criar um squad.');
    element.querySelector('button')?.click();
    expect(cancelled).toBe(1);
  });

  it('o grupo de amigos tem título, para o leitor de tela (CA24)', async () => {
    await render();
    expect(element.querySelector('legend')?.textContent).toBe('Quem entra');
  });
});
