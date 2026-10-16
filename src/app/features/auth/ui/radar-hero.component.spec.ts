import { TestBed } from '@angular/core/testing';

import { RadarHeroComponent, SWEEP_MS, polar } from './radar-hero.component';

describe('polar', () => {
  it('0° fica no topo e o ângulo cresce no sentido horário', () => {
    expect(polar(0, 100)).toEqual({ x: 120, y: 20 });
    expect(polar(90, 100)).toEqual({ x: 220, y: 120 });
    expect(polar(180, 100)).toEqual({ x: 120, y: 220 });
    expect(polar(270, 100)).toEqual({ x: 20, y: 120 });
  });

  it('arredonda para uma casa decimal', () => {
    expect(polar(45, 10)).toEqual({ x: 127.1, y: 112.9 });
  });
});

describe('RadarHeroComponent', () => {
  function render(): HTMLElement {
    const fixture = TestBed.createComponent(RadarHeroComponent);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  it('é decorativo: fica escondido de leitores de tela e fora do Tab (CA20)', () => {
    const element = render();
    expect(element.querySelector('.radar')?.getAttribute('aria-hidden')).toBe('true');
    expect(element.querySelector('svg')?.getAttribute('focusable')).toBe('false');
  });

  it('desenha quatro anéis, com destaque no externo, e a varredura', () => {
    const element = render();
    expect(element.querySelectorAll('.radar__ring')).toHaveLength(4);
    expect(element.querySelectorAll('.radar__ring--outer')).toHaveLength(1);
    expect(element.querySelector('.radar__sweep')).not.toBeNull();
  });

  it('tem marcações a cada 10°, maiores a cada 30°', () => {
    const element = render();
    expect(element.querySelectorAll('.radar__tick')).toHaveLength(36);
    expect(element.querySelectorAll('.radar__tick--major')).toHaveLength(12);
  });

  it('mostra três amigos, um por estado de presença, com a inicial no anel', () => {
    const element = render();
    const blips = Array.from(element.querySelectorAll<SVGGElement>('.radar__blip'));
    expect(blips.map((b) => b.querySelector('text')?.textContent?.trim())).toEqual(['A', 'L', 'M']);
    for (const state of ['playing', 'online', 'away']) {
      expect(element.querySelector(`.radar__blip--${state}`)).not.toBeNull();
    }
  });

  it('a volta da varredura leva 8 s e chega ao CSS pela variável --sweep-duration', () => {
    expect(SWEEP_MS).toBe(8000);
    const fixture = TestBed.createComponent(RadarHeroComponent);
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;
    expect(host.style.getPropertyValue('--sweep-duration')).toBe('8000ms');
  });

  it('cada amigo acende quando a varredura passa pelo ângulo dele', () => {
    const element = render();
    const delays = Array.from(element.querySelectorAll<SVGGElement>('.radar__blip')).map((b) =>
      b.style.getPropertyValue('--blip-delay'),
    );
    // Ângulos 40°, 150° e 250° de uma volta de SWEEP_MS.
    expect(delays).toEqual([
      `${(40 / 360) * SWEEP_MS}ms`,
      `${(150 / 360) * SWEEP_MS}ms`,
      `${(250 / 360) * SWEEP_MS}ms`,
    ]);
  });
});
