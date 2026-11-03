import { TestBed } from '@angular/core/testing';

import { PATENTES, progressFor } from '../../domain/patentes';
import { RankTrackComponent } from './rank-track.component';

function render(hours: number, hoursWithFriends = 0, distinctFriends = 0) {
  const fixture = TestBed.createComponent(RankTrackComponent);
  fixture.componentRef.setInput(
    'progress',
    progressFor({ hours, hoursWithFriends, distinctFriends }),
  );
  fixture.componentRef.setInput('hours', hours);
  fixture.detectChanges();
  return fixture.nativeElement as HTMLElement;
}

const stateOf = (element: HTMLElement, name: string) =>
  [...element.querySelectorAll('.track__item')]
    .find((item) => item.querySelector('.track__name')?.textContent === name)
    ?.querySelector('.pr-sr-only')?.textContent;

describe('RankTrackComponent', () => {
  it('mostra as 6 patentes em ordem e a atual em destaque (spec 004, CA12)', () => {
    const element = render(61);
    expect(element.querySelector('h2')?.textContent?.trim()).toBe('Sua patente: Veterano de lobby');
    expect([...element.querySelectorAll('.track__name')].map((node) => node.textContent)).toEqual(
      PATENTES.map((patente) => patente.name),
    );
    expect(element.querySelector('.track__item--current .track__name')?.textContent).toBe(
      'Veterano de lobby',
    );
  });

  it('diz em texto o estado de cada patente, não só na cor (CA12, CA23)', () => {
    const element = render(61);
    expect(stateOf(element, 'Soldado do fim de semana')).toBe('Conquistada');
    expect(stateOf(element, 'Veterano de lobby')).toBe('Patente atual');
    expect(stateOf(element, 'Lenda do squad')).toBe('Próxima');
  });

  it('diz de onde vêm as horas e o que falta para a próxima (CA12)', () => {
    const text = render(61).querySelector('.track__text')?.textContent?.replace(/\s+/g, ' ');
    expect(text).toContain('Soma de todos os seus jogos na Steam desde que você conectou: 61h.');
    expect(text).toContain('Faltam 19h e 20h com amigos para Lenda do squad.');
  });

  it('preenche a linha: cheia no que passou, parcial na atual, vazia no resto (CA12)', () => {
    const widths = [...render(60).querySelectorAll<HTMLElement>('.track__line span')].map(
      (node) => node.style.width,
    );
    expect(widths).toEqual(['100%', '100%', '100%', '50%', '0%']);
  });

  it('na última patente, avisa que chegou ao topo', () => {
    const element = render(200, 30, 5);
    expect(element.querySelector('h2')?.textContent?.trim()).toBe('Sua patente: Sem vida social');
    expect(element.querySelector('.track__text')?.textContent).toContain(
      'Você chegou à última patente.',
    );
  });

  it('sem horas, não fala em conexão com a Steam (CA18)', () => {
    const text = render(0).querySelector('.track__text')?.textContent;
    expect(text).not.toContain('desde que você conectou');
    expect(text).not.toContain('Soma');
    expect(text).toContain('Falta 1h para Recruta da fila.');
  });

  it('no celular, abre com a patente atual no meio (CA12)', () => {
    vi.spyOn(HTMLElement.prototype, 'offsetLeft', 'get').mockReturnValue(500);
    vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockReturnValue(100);
    vi.spyOn(Element.prototype, 'clientWidth', 'get').mockReturnValue(300);
    const element = render(61);
    TestBed.tick();
    expect(element.querySelector('.track__scroll')?.scrollLeft).toBe(400);
    vi.restoreAllMocks();
  });

  it('a trilha rola pelo teclado no celular (CA22, CA23)', () => {
    const scroll = render(0).querySelector('.track__scroll');
    expect(scroll?.getAttribute('tabindex')).toBe('0');
    expect(scroll?.getAttribute('aria-label')).toBe('Trilha das patentes');
  });
});
