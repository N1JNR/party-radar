import { TestBed } from '@angular/core/testing';

import { SquadRaceComponent } from './squad-race.component';

describe('SquadRaceComponent', () => {
  it('explica o que vem e "Copiar convite" avisa a página, sem dados de exemplo (spec 004, CA13)', () => {
    const fixture = TestBed.createComponent(SquadRaceComponent);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    const invite = vi.fn();
    fixture.componentInstance.invite.subscribe(invite);

    expect(element.querySelector('h2')?.textContent).toBe('Corrida do squad');
    expect(element.textContent).not.toMatch(/\d/);
    element.querySelector<HTMLButtonElement>('po-button button')?.click();
    expect(invite).toHaveBeenCalledTimes(1);
  });
});
