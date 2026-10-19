import { TestBed } from '@angular/core/testing';

import { SteamNoticeComponent } from './steam-notice.component';

const buttons = (element: HTMLElement) => [
  ...element.querySelectorAll<HTMLButtonElement>('po-button button'),
];

describe('SteamNoticeComponent', () => {
  it('explica o caminho na Steam e avisa quando a pessoa deixou público (CA8)', () => {
    const fixture = TestBed.createComponent(SteamNoticeComponent);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    const confirmed = vi.fn();
    fixture.componentInstance.confirmed.subscribe(confirmed);
    expect(element.querySelector('h2')?.textContent?.trim()).toBe('Sua Steam está privada');
    expect(element.querySelectorAll('.notice__path li')).toHaveLength(3);
    expect(element.textContent).toContain('Configurações de privacidade');
    buttons(element)[0].click();
    expect(confirmed).toHaveBeenCalledTimes(1);
  });

  it('mostra o botão carregando enquanto salva', () => {
    const fixture = TestBed.createComponent(SteamNoticeComponent);
    fixture.componentRef.setInput('marking', true);
    fixture.detectChanges();
    expect(buttons(fixture.nativeElement)[0].disabled).toBe(true);
  });
});
