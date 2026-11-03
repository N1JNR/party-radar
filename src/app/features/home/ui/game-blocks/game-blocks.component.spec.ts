import { TestBed } from '@angular/core/testing';

import { GameBlock, GameKind } from '../../domain/player-radar';
import { GameBlocksComponent } from './game-blocks.component';

const blocks: GameBlock[] = [
  { id: '1', name: 'ARC Raiders', hours: 313, kinds: ['tiro'] },
  { id: '2', name: 'Call of Duty', hours: 304, kinds: ['tiro'] },
  { id: '3', name: 'EA SPORTS FC 26', hours: 109, kinds: ['esporte'] },
  { id: 'outros', name: 'Outros 4 jogos', hours: 13, kinds: ['rpg', 'outros'] },
];

function render(list: GameBlock[], selected: GameKind | null = null) {
  const fixture = TestBed.createComponent(GameBlocksComponent);
  fixture.componentRef.setInput('blocks', list);
  fixture.componentRef.setInput('selected', selected);
  fixture.detectChanges();
  return fixture.nativeElement as HTMLElement;
}

const texts = (element: HTMLElement, selector: string) =>
  [...element.querySelectorAll(selector)].map((node) => node.textContent?.trim());

describe('GameBlocksComponent', () => {
  it('mostra nome e horas de cada jogo (spec 004, CA10)', () => {
    const element = render(blocks);
    expect(texts(element, '.block__name')).toEqual([
      'ARC Raiders',
      'Call of Duty',
      'EA SPORTS FC 26',
      'Outros 4 jogos',
    ]);
    expect(texts(element, '.block__hours')).toEqual(['313h', '304h', '109h', '13h']);
  });

  it('o tamanho do bloco segue as horas (CA10)', () => {
    const grows = [...render(blocks).querySelectorAll<HTMLElement>('.block')].map(
      (block) => block.style.flexGrow,
    );
    expect(grows).toEqual(['313', '304', '109', '13']);
  });

  it('os 2 maiores ficam na primeira linha, em destaque', () => {
    const element = render(blocks);
    expect(texts(element, '.block--big .block__name')).toEqual(['ARC Raiders', 'Call of Duty']);
    expect(element.querySelectorAll('.blocks__break')).toHaveLength(1);
  });

  it('acende só os jogos do tipo escolhido (CA4)', () => {
    const element = render(blocks, 'esporte');
    expect(texts(element, '.block--esporte .block__name')).toEqual(['EA SPORTS FC 26']);
    expect(element.querySelector('.block--tiro')).toBeNull();
  });

  it('muda de tipo e acende os outros (CA4)', () => {
    const element = render(blocks, 'tiro');
    expect(texts(element, '.block--tiro .block__name')).toEqual(['ARC Raiders', 'Call of Duty']);
  });

  it('o bloco somado acende quando tem um jogo do tipo (CA4)', () => {
    const element = render(blocks, 'outros');
    expect(texts(element, '.block--outros .block__name')).toEqual(['Outros 4 jogos']);
  });

  it('o bloco somado fica apagado sem jogo do tipo (CA4)', () => {
    const element = render(blocks, 'corrida');
    expect(element.querySelector('.block--lit')).toBeNull();
  });

  it('nome longo cabe no bloco e aparece completo na dica', () => {
    const name = 'SpongeBob SquarePants: Battle for Bikini Bottom - Rehydrated';
    const element = render([{ id: '1', name, hours: 8, kinds: ['aventura'] }]);
    expect(element.querySelector('.block')?.getAttribute('title')).toBe(name);
  });

  it('sem jogos, lista vazia', () => {
    expect(render([]).querySelectorAll('.block')).toHaveLength(0);
  });
});
