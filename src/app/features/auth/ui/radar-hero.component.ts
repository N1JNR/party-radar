import { ChangeDetectionStrategy, Component } from '@angular/core';

/**
 * Radar decorativo da tela Entrar (DESIGN.md, "anel de radar"): três anéis finos, três
 * sinais nas cores de presença e uma única onda ao abrir a tela. Sem significado para
 * leitores de tela, por isso fica escondido deles.
 */
@Component({
  selector: 'app-radar-hero',
  template: `
    <svg class="radar" viewBox="0 0 240 240" aria-hidden="true" focusable="false">
      <circle class="radar__ring" cx="120" cy="120" r="108" />
      <circle class="radar__ring" cx="120" cy="120" r="72" />
      <circle class="radar__ring" cx="120" cy="120" r="36" />
      <circle class="radar__echo" cx="120" cy="120" r="108" />
      <circle class="radar__blip radar__blip--playing" cx="156" cy="86" r="5" />
      <circle class="radar__blip radar__blip--online" cx="64" cy="150" r="4" />
      <circle class="radar__blip radar__blip--away" cx="188" cy="166" r="4" />
    </svg>
  `,
  styles: `
    :host {
      display: block;
      width: clamp(180px, 56vw, 300px);
    }
    .radar {
      display: block;
      width: 100%;
      height: auto;
    }
    .radar__ring {
      fill: none;
      stroke: var(--color-brand-01-light);
      stroke-width: 1;
      stroke-opacity: 0.18;
    }
    .radar__echo {
      fill: none;
      stroke: var(--color-brand-01-light);
      stroke-width: 2;
      opacity: 0;
      transform-box: fill-box;
      transform-origin: center;
      animation: radar-echo 1800ms ease-out 300ms 1 both;
    }
    .radar__blip--playing {
      fill: var(--pr-presence-playing);
    }
    .radar__blip--online {
      fill: var(--pr-presence-online);
    }
    .radar__blip--away {
      fill: var(--pr-presence-away);
    }
    @keyframes radar-echo {
      from {
        transform: scale(0.1);
        opacity: 0.7;
      }
      to {
        transform: scale(1);
        opacity: 0;
      }
    }
    @media (prefers-reduced-motion: reduce) {
      .radar__echo {
        animation: none;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RadarHeroComponent {}
