import { TestBed } from '@angular/core/testing';

import { SeasonTrophy } from '../../domain/season';
import { SeasonTrophiesComponent } from './season-trophies.component';

const trophies: SeasonTrophy[] = [
  { season: 1, rankId: 'recruta', hours: 6, topGame: null },
  { season: 2, rankId: 'veterano', hours: 46, topGame: 'Elden Ring' },
];

function render() {
  const fixture = TestBed.createComponent(SeasonTrophiesComponent);
  fixture.componentRef.setInput('trophies', trophies);
  fixture.detectChanges();
  return { fixture, element: fixture.nativeElement as HTMLElement };
}

describe('SeasonTrophiesComponent', () => {
  it('lista do troféu mais recente para o mais antigo (spec 005, CA12)', () => {
    const { element } = render();
    expect([...element.querySelectorAll('.trophies__name')].map((n) => n.textContent)).toEqual([
      'Temporada 2: Veterano de lobby',
      'Temporada 1: Recruta da fila',
    ]);
    expect([...element.querySelectorAll('.trophies__detail')].map((n) => n.textContent)).toEqual([
      '46h, mais em Elden Ring',
      '6h',
    ]);
  });

  it('é uma lista com título, para o leitor de tela (CA18)', () => {
    const { element } = render();
    expect(element.querySelector('h2')?.textContent).toBe('Troféus');
    expect(element.querySelector('section')?.getAttribute('aria-labelledby')).toBe(
      'trophies-title',
    );
    expect(element.querySelectorAll('li')).toHaveLength(2);
  });

  it('cada botão diz qual troféu compartilha (CA13, CA18)', () => {
    const { element } = render();
    const buttons = [...element.querySelectorAll('button')];
    expect(buttons.map((button) => button.getAttribute('aria-label'))).toEqual([
      'Compartilhar Temporada 2: Veterano de lobby',
      'Compartilhar Temporada 1: Recruta da fila',
    ]);
  });

  it('avisa qual troféu foi escolhido (CA13)', () => {
    const { fixture, element } = render();
    const shared: SeasonTrophy[] = [];
    fixture.componentInstance.share.subscribe((trophy) => shared.push(trophy));
    element.querySelector('button')?.click();
    expect(shared.map((trophy) => trophy.season)).toEqual([2]);
  });
});
