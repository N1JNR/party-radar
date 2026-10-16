import { TestBed } from '@angular/core/testing';

import { StrengthenCardComponent } from './strengthen-card.component';

const buttons = (element: HTMLElement) => [
  ...element.querySelectorAll<HTMLButtonElement>('po-button button'),
];
const texts = (element: HTMLElement, selector: string) =>
  [...element.querySelectorAll(selector)].map((node) => node.textContent?.trim());

describe('StrengthenCardComponent', () => {
  function render(steamPublic: boolean, friendsCount: number) {
    const fixture = TestBed.createComponent(StrengthenCardComponent);
    fixture.componentRef.setInput('steamPublic', steamPublic);
    fixture.componentRef.setInput('friendsCount', friendsCount);
    fixture.detectChanges();
    return { fixture, element: fixture.nativeElement as HTMLElement };
  }

  it('no primeiro acesso, Discord feito e o resto faltando, em texto (CA7, CA17)', () => {
    const { element } = render(false, 0);
    expect(element.querySelector('h2')?.textContent?.trim()).toBe('Deixe seu card mais forte');
    expect(texts(element, '.steps__label')).toEqual([
      'Discord conectado',
      'Steam pública',
      'Convidar amigos',
    ]);
    expect(texts(element, '.steps__state')).toEqual(['Feito', 'Falta', 'Falta']);
    expect(element.querySelectorAll('.steps__item--done')).toHaveLength(1);
  });

  it('sem amigos, "Copiar convite" avisa a página', () => {
    const { fixture, element } = render(false, 0);
    const invite = vi.fn();
    fixture.componentInstance.invite.subscribe(invite);
    expect(buttons(element)[0].textContent).toContain('Copiar convite');
    buttons(element)[0].click();
    expect(invite).toHaveBeenCalledTimes(1);
  });

  it('com amigos, não oferece o convite', () => {
    const { element } = render(true, 2);
    expect(texts(element, '.steps__state')).toEqual(['Feito', 'Feito', 'Feito']);
    expect(buttons(element)).toHaveLength(0);
  });
});
