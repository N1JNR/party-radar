import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GameKind, PlayedGame } from '../../domain/player-radar';
import { PlayerRadarComponent } from './player-radar.component';

const game = (appId: number, kind: GameKind, totalHours: number, monthHours = 0): PlayedGame => ({
  appId,
  name: `Jogo ${appId}`,
  kind,
  totalHours,
  monthHours,
  previousMonthHours: 0,
});

const library = [
  game(1, 'tiro', 644, 15),
  game(2, 'esporte', 109),
  game(3, 'aventura', 22),
  game(4, 'rpg', 11),
  game(5, 'outros', 2),
];

describe('PlayerRadarComponent', () => {
  let fixture: ComponentFixture<PlayerRadarComponent>;
  let element: HTMLElement;

  function render(games: PlayedGame[]): void {
    fixture = TestBed.createComponent(PlayerRadarComponent);
    fixture.componentRef.setInput('games', games);
    fixture.detectChanges();
    element = fixture.nativeElement as HTMLElement;
  }

  const button = (label: string) =>
    [...element.querySelectorAll('button')].find((b) => b.textContent?.includes(label))!;
  const click = (label: string) => {
    button(label).click();
    fixture.detectChanges();
  };

  it('mostra um eixo por tipo de jogo e o título (spec 004, CA1)', () => {
    render(library);
    expect(element.querySelector('h2')?.textContent).toBe('Atirador nato');
    expect(
      [...element.querySelectorAll('.radar__label')].map((node) => node.textContent?.trim()),
    ).toEqual(['Tiro', 'Esporte', 'Corrida', 'Simulação', 'Arcade', 'RPG', 'Aventura']);
    expect(element.querySelector('.radar__shape')?.getAttribute('points')?.split(' ')).toHaveLength(
      7,
    );
  });

  it('mostra as porcentagens reais, com "Outros" na lista (CA2)', () => {
    render(library);
    expect(
      [...element.querySelectorAll('.radar__kind')].map((node) => node.textContent?.trim()),
    ).toEqual(['Tiro 82%', 'Esporte 14%', 'Aventura 3%', 'RPG 1%', 'Outros 0%']);
  });

  it('descreve o radar para leitor de tela (CA23)', () => {
    render(library);
    expect(element.querySelector('svg')?.getAttribute('aria-label')).toBe(
      'Radar do jogador: 82% Tiro, 14% Esporte, 3% Aventura, 1% RPG.',
    );
    expect(element.querySelector('svg')?.getAttribute('role')).toBe('img');
  });

  it('"Este mês" troca o radar, as porcentagens, as horas e o título (CA3)', () => {
    render([game(1, 'tiro', 100, 0), game(2, 'rpg', 20, 15)]);
    expect(element.querySelector('h2')?.textContent).toBe('Atirador nato');
    expect(element.querySelector('.radar__caption')?.textContent).toBe('120h em 2 jogos');
    const before = element.querySelector('.radar__shape')?.getAttribute('points');

    click('Este mês');

    expect(button('Este mês').getAttribute('aria-pressed')).toBe('true');
    expect(button('Desde sempre').getAttribute('aria-pressed')).toBe('false');
    expect(element.querySelector('h2')?.textContent).toBe('Viciado em side quest');
    expect(element.querySelector('.radar__caption')?.textContent).toBe('15h em 1 jogo');
    expect(element.querySelector('.radar__shape')?.getAttribute('points')).not.toBe(before);
    expect(
      [...element.querySelectorAll('.radar__kind')].map((node) => node.textContent?.trim()),
    ).toEqual(['RPG 100%']);
  });

  it('volta para "Desde sempre"', () => {
    render(library);
    click('Este mês');
    click('Desde sempre');
    expect(element.querySelector('.radar__caption')?.textContent).toBe('788h em 5 jogos');
  });

  it('começa com o tipo mais jogado aceso (CA4)', () => {
    render(library);
    expect(button('Tiro 82%').getAttribute('aria-pressed')).toBe('true');
    expect(element.querySelector('.radar__label--selected')?.textContent?.trim()).toBe('Tiro');
    expect(fixture.componentInstance.selectedKind()).toBe('tiro');
  });

  it('tocar num tipo acende o eixo dele (CA4)', () => {
    render(library);
    click('Esporte');
    expect(button('Esporte').getAttribute('aria-pressed')).toBe('true');
    expect(button('Tiro').getAttribute('aria-pressed')).toBe('false');
    expect(element.querySelector('.radar__label--selected')?.textContent?.trim()).toBe('Esporte');
    expect(fixture.componentInstance.selectedKind()).toBe('esporte');
    const selected = element.querySelector('.radar__dot--selected');
    expect(selected?.getAttribute('r')).toBe('8');
  });

  it('se o tipo escolhido não tem horas no período, acende o mais jogado', () => {
    render(library);
    click('Esporte');
    click('Este mês');
    expect(fixture.componentInstance.selectedKind()).toBe('tiro');
    click('Desde sempre');
    expect(fixture.componentInstance.selectedKind()).toBe('esporte');
  });

  it('"Outros" pode ser escolhido, mas não acende eixo', () => {
    render(library);
    click('Outros');
    expect(fixture.componentInstance.selectedKind()).toBe('outros');
    expect(element.querySelector('.radar__label--selected')).toBeNull();
  });

  it('sem horas no período: radar vazio com a frase, e os períodos continuam (CA19)', () => {
    render([game(1, 'tiro', 100, 0)]);
    click('Este mês');
    expect(element.querySelector('.radar__shape')).toBeNull();
    expect(element.querySelector('.radar__empty')?.textContent).toBe(
      'Até a geladeira tem mais tempo de tela que você.',
    );
    expect(element.querySelector('h2')?.textContent).toBe('Seu radar');
    expect(element.querySelector('.radar__kinds')).toBeNull();
    expect(button('Desde sempre')).toBeTruthy();
    expect(element.querySelector('.radar__label')).not.toBeNull();
  });

  it('sem jogos nenhum: radar vazio (CA18)', () => {
    render([]);
    expect(element.querySelector('.radar__shape')).toBeNull();
    expect(element.querySelector('svg')?.getAttribute('aria-label')).toBe(
      'Radar do jogador sem horas.',
    );
    expect(fixture.componentInstance.selectedKind()).toBeNull();
  });

  it('tem a varredura, que o CSS desliga com prefers-reduced-motion (CA24)', () => {
    render(library);
    expect(element.querySelector('.radar__sweep')).not.toBeNull();
  });
});
