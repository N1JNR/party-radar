import { TestBed } from '@angular/core/testing';

import { RadarHeroComponent } from './radar-hero.component';

describe('RadarHeroComponent', () => {
  function render(): HTMLElement {
    const fixture = TestBed.createComponent(RadarHeroComponent);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  it('é decorativo: fica escondido de leitores de tela e fora do Tab (CA20)', () => {
    const svg = render().querySelector('svg');
    expect(svg?.getAttribute('aria-hidden')).toBe('true');
    expect(svg?.getAttribute('focusable')).toBe('false');
  });

  it('desenha três anéis e uma única onda', () => {
    const element = render();
    expect(element.querySelectorAll('.radar__ring')).toHaveLength(3);
    expect(element.querySelectorAll('.radar__echo')).toHaveLength(1);
  });

  it('mostra um sinal para cada estado de presença ativo', () => {
    const element = render();
    for (const state of ['playing', 'online', 'away']) {
      expect(element.querySelector(`.radar__blip--${state}`)).not.toBeNull();
    }
  });
});
