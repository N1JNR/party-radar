import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PlayerCard } from '../../domain/player-card';
import { PlayerHeaderComponent } from './player-header.component';

const card: PlayerCard = {
  name: 'palmajnr_',
  username: 'palmajnr_',
  avatarUrl: null,
  playingNow: null,
  monthHours: 15,
  estimate: false,
  steamName: null,
  updatedAt: null,
  games: 1,
  gameOfMonth: null,
};

describe('PlayerHeaderComponent', () => {
  let fixture: ComponentFixture<PlayerHeaderComponent>;
  let element: HTMLElement;

  function render(fields: Partial<PlayerCard> = {}, canShare = true, now?: Date): void {
    fixture = TestBed.createComponent(PlayerHeaderComponent);
    fixture.componentRef.setInput('card', { ...card, ...fields });
    fixture.componentRef.setInput('canShare', canShare);
    if (now) {
      fixture.componentRef.setInput('now', now);
    }
    fixture.detectChanges();
    element = fixture.nativeElement as HTMLElement;
  }

  const lines = () =>
    [...element.querySelectorAll('.player__line')].map((node) => node.textContent?.trim());

  it('mostra o nome do Discord como título da tela e o @usuário', () => {
    render();
    expect(element.querySelector('h1')?.textContent).toBe('palmajnr_');
    expect(lines()).toEqual(['@palmajnr_']);
  });

  it('mostra "<nome> na Steam" logo abaixo do @usuário (spec 003, CA21)', () => {
    render({ steamName: 'N1JNR' });
    expect(lines()).toEqual(['@palmajnr_', 'N1JNR na Steam']);
  });

  it('jogando: anel de radar e o texto (spec 003, CA10)', () => {
    render({ playingNow: 'ARC Raiders' });
    expect(element.querySelector('.player__avatar--playing')).not.toBeNull();
    expect(element.querySelector('.player__status')?.textContent).toBe('Jogando ARC Raiders agora');
  });

  it('sem jogo aberto: sem anel e sem texto', () => {
    render();
    expect(element.querySelector('.player__avatar--playing')).toBeNull();
    expect(element.querySelector('.player__status')).toBeNull();
  });

  it('leitura velha: "Atualizado há <tempo>" (spec 003, CA15)', () => {
    render({ updatedAt: '2026-11-01T12:00:00Z' }, true, new Date('2026-11-03T12:00:00Z'));
    expect(lines()).toContain('Atualizado há 2 dias');
  });

  it('o botão de compartilhar avisa a página (spec 004, CA14)', () => {
    render();
    const share = vi.fn();
    fixture.componentInstance.share.subscribe(share);
    const button = element.querySelector<HTMLButtonElement>('po-button button');
    expect(button?.textContent).toContain('Compartilhar meu radar');
    button?.click();
    expect(share).toHaveBeenCalledTimes(1);
  });

  it('sem horas, sem o botão (spec 004, CA18)', () => {
    render({}, false);
    expect(element.querySelector('po-button')).toBeNull();
  });
});
