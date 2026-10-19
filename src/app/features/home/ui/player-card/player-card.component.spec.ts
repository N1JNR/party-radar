import { ComponentFixture, TestBed } from '@angular/core/testing';

import { progressFor } from '../../domain/patentes';
import { PlayerCard, platformShares } from '../../domain/player-card';
import { PlayerCardComponent } from './player-card.component';

const fullCard: PlayerCard = {
  name: 'Ana Souza',
  username: 'ana',
  avatarUrl: null,
  playingNow: 'Elden Ring',
  title: 'Sofredor de Souls',
  stats: { hours: 42, hoursWithFriends: 11, distinctFriends: 3 },
  games: 7,
  gameOfMonth: { name: 'Elden Ring', hours: 18 },
  partner: { id: 'rafa', name: 'Rafa', avatarUrl: null, matches: 18, probable: false },
  platforms: [
    { platform: 'pc', hours: 28 },
    { platform: 'ps5', hours: 12 },
  ],
};

const emptyCard: PlayerCard = {
  ...fullCard,
  playingNow: null,
  title: null,
  stats: { hours: 0, hoursWithFriends: 0, distinctFriends: 0 },
  games: 0,
  gameOfMonth: null,
  partner: null,
  platforms: [],
};

describe('PlayerCardComponent', () => {
  let fixture: ComponentFixture<PlayerCardComponent>;
  let element: HTMLElement;

  function render(card: PlayerCard, firstAccess = false): void {
    fixture = TestBed.createComponent(PlayerCardComponent);
    fixture.componentRef.setInput('card', card);
    fixture.componentRef.setInput('progress', progressFor(card.stats));
    fixture.componentRef.setInput('platforms', platformShares(card.platforms));
    fixture.componentRef.setInput('firstAccess', firstAccess);
    fixture.detectChanges();
    element = fixture.nativeElement as HTMLElement;
  }

  const text = (selector: string) => element.querySelector(selector)?.textContent?.trim() ?? null;
  const all = (selector: string) =>
    [...element.querySelectorAll(selector)].map((node) =>
      node.textContent?.replace(/\s+/g, ' ').trim(),
    );

  it('cheio: nome, patente, título, horas, jogos, jogo do mês, parceiro, plataformas e próxima (CA4)', () => {
    render(fullCard);
    expect(text('h2')).toBe('Ana Souza');
    expect(text('.player-card__username')).toBe('@ana');
    expect(text('.player-card__patente')).toBe('Veterano de lobby');
    expect(text('.player-card__title-value')).toBe('Sofredor de Souls');
    expect(text('.player-card__hours-value')).toBe('42h');
    expect(text('.player-card__hours-caption')).toBe('jogadas este mês, em 7 jogos');
    expect(all('.player-card__stat-value')).toEqual(['Elden Ring', 'Rafa']);
    expect(all('.player-card__stat-caption')).toEqual(['18h', '18 partidas juntos']);
    expect(all('.player-card__platform-name')).toEqual(['PC', 'PS5']);
    expect(all('.player-card__platform-percent')).toEqual(['70%', '30%']);
    expect(text('.player-card__next-name')).toBe('Lenda do squad');
    expect(text('.player-card__remaining')).toBe('Faltam 38h e 9h com amigos para Lenda do squad.');
    const bar = element.querySelector('[role="progressbar"]');
    expect(bar?.getAttribute('aria-valuenow')).toBe('5');
    expect(bar?.getAttribute('aria-label')).toBe('Progresso para Lenda do squad');
    expect(element.querySelector('.player-card__phrase')).toBeNull();
  });

  it('jogando: anel na cor "jogando" e texto "Jogando <jogo> agora" (CA5)', () => {
    render(fullCard);
    expect(element.querySelector('.player-card__avatar--playing')).not.toBeNull();
    expect(text('.player-card__status')).toBe('Jogando Elden Ring agora');
  });

  it('sem jogar: sem anel e sem texto de status (CA5)', () => {
    render({ ...fullCard, playingNow: null });
    expect(element.querySelector('.player-card__avatar--playing')).toBeNull();
    expect(element.querySelector('.player-card__status')).toBeNull();
  });

  it('parceria provável aparece com o aviso discreto (CA6)', () => {
    render({ ...fullCard, partner: { ...fullCard.partner!, probable: true } });
    expect(element.querySelector('po-tag.player-card__probable')).not.toBeNull();
    expect(text('po-tag.player-card__probable')).toContain('provável');
  });

  it('parceria confirmada não tem o aviso (CA6)', () => {
    render(fullCard);
    expect(element.querySelector('.player-card__probable')).toBeNull();
  });

  it('primeiro acesso: 0h, NPC e frases engraçadas no lugar dos dados (CA7)', () => {
    render(emptyCard, true);
    expect(text('.player-card__hours-value')).toBe('0h');
    expect(text('.player-card__patente')).toBe('NPC');
    expect(element.querySelector('.player-card__title')).toBeNull();
    expect(all('.player-card__phrase')).toEqual([
      'Até a geladeira tem mais tempo de tela que você.',
      'Nenhum. Ainda.',
      'Nem o bot quer duo.',
      'Plataforma: um mistério.',
    ]);
    expect(text('.player-card__remaining')).toBe('Falta 1h para Recruta da fila.');
  });

  it('na última patente não mostra barra de progresso', () => {
    render({ ...fullCard, stats: { hours: 300, hoursWithFriends: 60, distinctFriends: 8 } });
    expect(element.querySelector('[role="progressbar"]')).toBeNull();
    expect(text('.player-card__next-name')).toContain('Patente máxima');
  });

  it('Ver patentes avisa a página', () => {
    render(fullCard);
    const seePatentes = vi.fn();
    fixture.componentInstance.seePatentes.subscribe(seePatentes);
    element.querySelector<HTMLButtonElement>('po-button button')!.click();
    expect(seePatentes).toHaveBeenCalledTimes(1);
  });
});
