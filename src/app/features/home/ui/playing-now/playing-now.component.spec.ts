import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FriendPresence } from '../../domain/friend-presence';
import { PlayingNowComponent } from './playing-now.component';

const now = new Date('2026-10-16T22:00:00Z');
const friends: FriendPresence[] = [
  {
    id: 'bia',
    name: 'Bia',
    avatarUrl: null,
    game: 'Fortnite',
    platform: 'ps5',
    startedAt: '2026-10-16T20:40:00Z',
  },
  {
    id: 'rafa',
    name: 'Rafa',
    avatarUrl: null,
    game: 'CS2',
    platform: 'pc',
    startedAt: '2026-10-16T21:20:00Z',
  },
];

describe('PlayingNowComponent', () => {
  let fixture: ComponentFixture<PlayingNowComponent>;
  let element: HTMLElement;

  function render(list: FriendPresence[]): void {
    fixture = TestBed.createComponent(PlayingNowComponent);
    fixture.componentRef.setInput('friends', list);
    fixture.componentRef.setInput('now', now);
    fixture.detectChanges();
    element = fixture.nativeElement as HTMLElement;
  }

  const texts = (selector: string) =>
    [...element.querySelectorAll(selector)].map((node) => node.textContent?.trim());

  it('lista quem está jogando, com jogo, tempo e plataforma', () => {
    render(friends);
    expect(element.querySelector('h2')?.textContent?.trim()).toBe('Jogando agora');
    expect(texts('.friend__name')).toEqual(['Bia', 'Rafa']);
    expect(texts('.friend__game')).toEqual(['Jogando Fortnite', 'Jogando CS2']);
    expect(texts('.friend__meta span')).toEqual(['há 1h20', 'PS5', 'há 40 min', 'PC']);
    expect(element.querySelector('po-button')).toBeNull();
  });

  it('vazio: "Ninguém jogando por aqui" com "Copiar convite" (CA9)', () => {
    render([]);
    const invite = vi.fn();
    fixture.componentInstance.invite.subscribe(invite);
    expect(element.querySelector('.panel__empty')?.textContent?.trim()).toBe(
      'Ninguém jogando por aqui',
    );
    const button = element.querySelector<HTMLButtonElement>('po-button button')!;
    expect(button.textContent).toContain('Copiar convite');
    button.click();
    expect(invite).toHaveBeenCalledTimes(1);
  });
});
