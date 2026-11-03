import { TestBed } from '@angular/core/testing';

import { PlayerCard } from '../../domain/player-card';
import { MonthSummaryComponent } from './month-summary.component';

const card: PlayerCard = {
  name: 'Ana',
  username: 'ana',
  avatarUrl: null,
  playingNow: null,
  stats: { hours: 61, hoursWithFriends: 0, distinctFriends: 0 },
  monthHours: 15.6,
  estimate: false,
  steamName: null,
  updatedAt: null,
  games: 1,
  gameOfMonth: { name: 'ARC Raiders', hours: 15.6 },
};

function render(fields: Partial<PlayerCard> = {}, previousHours = 0, previousIsEstimate = false) {
  const fixture = TestBed.createComponent(MonthSummaryComponent);
  fixture.componentRef.setInput('card', { ...card, ...fields });
  fixture.componentRef.setInput('previousHours', previousHours);
  fixture.componentRef.setInput('previousIsEstimate', previousIsEstimate);
  fixture.componentRef.setInput('now', new Date('2026-11-03T15:00:00Z'));
  fixture.detectChanges();
  return fixture.nativeElement as HTMLElement;
}

const texts = (element: HTMLElement) =>
  [...element.querySelectorAll('.month__text')].map((node) => node.textContent?.trim());

describe('MonthSummaryComponent', () => {
  it('mostra o mês atual, as horas e o jogo (spec 004, CA11)', () => {
    const element = render();
    expect(element.querySelector('h2')?.textContent).toBe('Novembro até agora');
    expect(element.querySelector('.month__hours')?.textContent).toBe('15h');
    expect(texts(element)).toEqual(['em ARC Raiders']);
  });

  it('com vários jogos, mostra quantos e o jogo do mês (spec 003, CA8)', () => {
    const element = render({ games: 3, gameOfMonth: { name: 'CS2', hours: 9 } });
    expect(texts(element)).toEqual(['em 3 jogos', 'Jogo do mês: CS2, 9h']);
  });

  it('compara com o mês anterior (CA11)', () => {
    expect(texts(render({}, 46))).toContain('Outubro fechou em 46h.');
  });

  it('marca o mês anterior como estimativa, se foi o da conexão (CA11)', () => {
    expect(texts(render({}, 46, true))).toContain('Outubro fechou em 46h (estimativa).');
  });

  it('sem dados do mês anterior, só o mês atual (CA11)', () => {
    expect(texts(render())).toHaveLength(1);
  });

  it('sem horas no mês, diz isso (CA19)', () => {
    const element = render({ monthHours: 0, games: 0, gameOfMonth: null });
    expect(element.querySelector('.month__hours')?.textContent).toBe('0h');
    expect(texts(element)).toEqual(['Nenhuma hora neste mês ainda.']);
  });

  it('avisa quando o mês é estimativa (decisão da spec 003)', () => {
    expect(render({ estimate: true }).querySelector('.month__note')?.textContent).toContain(
      'estimativa',
    );
    expect(render().querySelector('.month__note')).toBeNull();
  });
});
