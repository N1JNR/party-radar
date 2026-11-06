import { TestBed } from '@angular/core/testing';

import { SteamStepState } from '../../domain/strengthen';
import { StrengthenCardComponent } from './strengthen-card.component';

const buttons = (element: HTMLElement) => [
  ...element.querySelectorAll<HTMLButtonElement>('po-button button'),
];
const texts = (element: HTMLElement, selector: string) =>
  [...element.querySelectorAll(selector)].map((node) => node.textContent?.trim());

describe('StrengthenCardComponent', () => {
  function render(steam: SteamStepState) {
    const fixture = TestBed.createComponent(StrengthenCardComponent);
    fixture.componentRef.setInput('steam', steam);
    fixture.detectChanges();
    return { fixture, element: fixture.nativeElement as HTMLElement };
  }

  it('sem Steam: Discord feito, o resto faltando, em texto (spec 002 CA7, spec 003 CA1)', () => {
    const { element } = render('not-connected');
    expect(element.querySelector('h2')?.textContent?.trim()).toBe('Deixe seu card mais forte');
    expect(texts(element, '.steps__label')).toEqual([
      'Discord conectado',
      'Conectar Steam',
      'Steam pública',
    ]);
    expect(texts(element, '.steps__state')).toEqual(['Feito', 'Falta', 'Falta']);
    expect(element.querySelectorAll('.steps__item--done')).toHaveLength(1);
  });

  it('não tem mais o passo "Convidar amigos" (spec 009, CA3)', () => {
    const { element } = render('not-connected');
    expect(element.textContent).not.toContain('Convidar amigos');
    expect(element.textContent).not.toContain('Copiar convite');
  });

  it('sem Steam, "Conectar Steam" avisa a página (spec 003, CA1)', () => {
    const { fixture, element } = render('not-connected');
    const connect = vi.fn();
    fixture.componentInstance.connectSteam.subscribe(connect);
    expect(buttons(element).map((b) => b.textContent?.trim())).toEqual(['Conectar Steam']);
    buttons(element)[0].click();
    expect(connect).toHaveBeenCalledTimes(1);
  });

  it('Steam conectada, lendo os dados, com "Tentar de novo" (spec 003, CA2, CA19)', () => {
    const { fixture, element } = render('reading');
    const retry = vi.fn();
    fixture.componentInstance.retrySteam.subscribe(retry);
    expect(texts(element, '.steps__state')).toEqual([
      'Feito',
      'Feito',
      'Lendo seus dados da Steam…',
    ]);
    expect(buttons(element).map((b) => b.textContent?.trim())).toEqual(['Tentar de novo']);
    buttons(element)[0].click();
    expect(retry).toHaveBeenCalledTimes(1);
  });

  it('"Tentar de novo" mostra que está lendo (CA19)', () => {
    const { fixture, element } = render('reading');
    fixture.componentRef.setInput('checking', true);
    fixture.detectChanges();
    expect(buttons(element)[0].disabled).toBe(true);
  });

  it('Steam pública: tudo feito, sem botões', () => {
    const { element } = render('public');
    expect(texts(element, '.steps__state')).toEqual(['Feito', 'Feito', 'Feito']);
    expect(buttons(element)).toHaveLength(0);
  });
});
