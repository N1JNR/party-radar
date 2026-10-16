import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FriendPresence } from '../../domain/friend-presence';
import { SquadOpportunity } from '../../domain/squad-opportunity';
import { SquadOpportunityComponent } from './squad-opportunity.component';

const member = (id: string, platform: FriendPresence['platform']): FriendPresence => ({
  id,
  name: id.toUpperCase(),
  avatarUrl: null,
  game: 'Fortnite',
  platform,
  startedAt: '2026-10-16T21:00:00Z',
});

const opportunity: SquadOpportunity = {
  squad: { id: 'sexta', name: 'Squad da Sexta', memberIds: ['bia', 'caio', 'duda'] },
  game: 'Fortnite',
  members: [member('bia', 'ps5'), member('caio', 'pc'), member('duda', 'xbox')],
};

describe('SquadOpportunityComponent', () => {
  let fixture: ComponentFixture<SquadOpportunityComponent>;
  let element: HTMLElement;

  function render(hasSquads: boolean, value: SquadOpportunity | null): void {
    fixture = TestBed.createComponent(SquadOpportunityComponent);
    fixture.componentRef.setInput('hasSquads', hasSquads);
    fixture.componentRef.setInput('opportunity', value);
    fixture.detectChanges();
    element = fixture.nativeElement as HTMLElement;
  }

  const button = () => element.querySelector<HTMLButtonElement>('po-button button')!;

  it('destaca o squad no mesmo jogo, com nomes e plataformas (CA12)', () => {
    render(true, opportunity);
    const call = vi.fn();
    fixture.componentInstance.callSquad.subscribe(call);
    expect(element.querySelector('h2')?.textContent?.trim()).toBe(
      '3 do Squad da Sexta no Fortnite',
    );
    expect(
      [...element.querySelectorAll('.members__item')].map((item) =>
        [...item.children].map((child) => child.textContent?.trim()),
      ),
    ).toEqual([
      ['BIA', 'PS5'],
      ['CAIO', 'PC'],
      ['DUDA', 'Xbox'],
    ]);
    expect(button().textContent).toContain('Chamar o squad');
    button().click();
    expect(call).toHaveBeenCalledWith(opportunity);
  });

  it('sem squads: "Nenhum squad ainda" com "Formar squad" (CA10)', () => {
    render(false, null);
    const formSquad = vi.fn();
    fixture.componentInstance.formSquad.subscribe(formSquad);
    expect(element.querySelector('h2')?.textContent?.trim()).toBe('Nenhum squad ainda');
    expect(button().textContent).toContain('Formar squad');
    button().click();
    expect(formSquad).toHaveBeenCalledTimes(1);
  });

  it('com squads e sem oportunidade, não mostra nada', () => {
    render(true, null);
    expect(element.querySelector('section')).toBeNull();
  });
});
