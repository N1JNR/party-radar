import { TestBed } from '@angular/core/testing';

import { PATENTES, progressFor } from '../../domain/patentes';
import { SeasonProgress } from '../../domain/season';
import { RankTrackComponent } from './rank-track.component';

const seasonWith = (hours: number): SeasonProgress => ({
  number: 1,
  daysLeft: 52,
  hours,
  topGame: 'ARC Raiders',
});

function render(hours: number, season: SeasonProgress | null = seasonWith(hours), career = 788) {
  const fixture = TestBed.createComponent(RankTrackComponent);
  fixture.componentRef.setInput('progress', progressFor(hours));
  fixture.componentRef.setInput('season', season);
  fixture.componentRef.setInput('careerHours', career);
  fixture.detectChanges();
  return fixture.nativeElement as HTMLElement;
}

const textOf = (element: HTMLElement) =>
  element.querySelector('.track__text')?.textContent?.replace(/\s+/g, ' ') ?? '';

const stateOf = (element: HTMLElement, name: string) =>
  [...element.querySelectorAll('.track__item')]
    .find((item) => item.querySelector('.track__name')?.textContent === name)
    ?.querySelector('.pr-sr-only')?.textContent;

describe('RankTrackComponent', () => {
  it('mostra as 6 patentes em ordem e a atual em destaque (spec 005, CA4)', () => {
    const element = render(42);
    expect(element.querySelector('h2')?.textContent?.trim()).toBe('Sua patente: Veterano de lobby');
    expect([...element.querySelectorAll('.track__name')].map((node) => node.textContent)).toEqual(
      PATENTES.map((patente) => patente.name),
    );
    expect(element.querySelector('.track__item--current .track__name')?.textContent).toBe(
      'Veterano de lobby',
    );
  });

  it('diz a temporada, os dias, as horas e o que falta (CA1, CA4)', () => {
    const text = textOf(render(42));
    expect(text).toContain('Temporada 1: faltam 52 dias.');
    expect(text).toContain('42h nesta temporada, somando todos os seus jogos.');
    expect(text).toContain('Faltam 78h para Lenda.');
  });

  it('mostra a meta e o ritmo de cada patente, sem falar em amigos (CA4)', () => {
    const element = render(42);
    const lenda = [...element.querySelectorAll('.track__item')].find(
      (item) => item.querySelector('.track__name')?.textContent === 'Lenda',
    );
    expect([...(lenda?.querySelectorAll('.track__rule') ?? [])].map((n) => n.textContent)).toEqual([
      '120h',
      'cerca de 2h por dia',
    ]);
    expect(element.textContent).not.toContain('amigo');
  });

  it('NPC não tem ritmo', () => {
    const npc = render(0).querySelector('.track__item');
    expect([...(npc?.querySelectorAll('.track__rule') ?? [])].map((n) => n.textContent)).toEqual([
      'Início da temporada',
    ]);
  });

  it('mostra a carreira, que não zera com a temporada (CA14)', () => {
    expect(textOf(render(0))).toContain('Carreira: 788h na Steam.');
  });

  it('sem horas na Steam, não mostra a carreira (CA16)', () => {
    expect(textOf(render(0, seasonWith(0), 0))).not.toContain('Carreira');
  });

  it('diz em texto o estado de cada patente, e só a seguinte é "Próxima" (CA18)', () => {
    const element = render(42);
    expect(stateOf(element, 'Soldado do fim de semana')).toBe('Conquistada');
    expect(stateOf(element, 'Veterano de lobby')).toBe('Patente atual');
    expect(stateOf(element, 'Lenda')).toBe('Próxima');
    expect(stateOf(element, 'Sem vida social')).toBe('A conquistar');
  });

  it('preenche a linha: cheia no que passou, parcial na atual, vazia no resto (CA4)', () => {
    const widths = [...render(80).querySelectorAll<HTMLElement>('.track__line-fill span')].map(
      (node) => node.style.width,
    );
    expect(widths).toEqual(['100%', '100%', '100%', '50%', '0%']);
  });

  it('na última patente, avisa que chegou ao topo', () => {
    const element = render(200);
    expect(element.querySelector('h2')?.textContent?.trim()).toBe('Sua patente: Sem vida social');
    expect(textOf(element)).toContain('Você chegou à última patente.');
  });

  it('sem horas na temporada, diz que ainda não há (CA2)', () => {
    const text = textOf(render(0));
    expect(text).toContain('Nenhuma hora nesta temporada ainda.');
    expect(text).toContain('Faltam 5h para Recruta da fila.');
  });

  it('sem Steam conectada, fica em NPC e convida a conectar (CA16)', () => {
    const element = render(0, null, 0);
    expect(element.querySelector('h2')?.textContent?.trim()).toBe('Sua patente: NPC');
    expect(textOf(element)).toContain('Conecte a Steam para entrar na temporada.');
    expect(textOf(element)).not.toContain('Temporada 1');
  });

  it('só mostra compartilhar quando pode, e avisa o toque (CA13)', () => {
    const fixture = TestBed.createComponent(RankTrackComponent);
    fixture.componentRef.setInput('progress', progressFor(42));
    fixture.componentRef.setInput('season', seasonWith(42));
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('button')).toBeNull();

    fixture.componentRef.setInput('canShare', true);
    fixture.detectChanges();
    let shared = 0;
    fixture.componentInstance.share.subscribe(() => (shared += 1));
    const button = element.querySelector('button');
    expect(button?.textContent).toContain('Compartilhar temporada');
    button?.click();
    expect(shared).toBe(1);
  });

  it('no celular, abre com a patente atual no meio (spec 004, CA12)', () => {
    vi.spyOn(HTMLElement.prototype, 'offsetLeft', 'get').mockReturnValue(500);
    vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockReturnValue(100);
    vi.spyOn(Element.prototype, 'clientWidth', 'get').mockReturnValue(300);
    const element = render(42);
    TestBed.tick();
    expect(element.querySelector('.track__scroll')?.scrollLeft).toBe(400);
    vi.restoreAllMocks();
  });

  it('a trilha rola pelo teclado no celular (spec 004, CA22, CA23)', () => {
    const scroll = render(0).querySelector('.track__scroll');
    expect(scroll?.getAttribute('tabindex')).toBe('0');
    expect(scroll?.getAttribute('aria-label')).toBe('Trilha das patentes');
  });
});
