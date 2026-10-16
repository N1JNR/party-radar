import { ChangeDetectionStrategy, Component } from '@angular/core';

type Presence = 'playing' | 'online' | 'away';

interface Blip {
  initial: string;
  presence: Presence;
  x: number;
  y: number;
  /** Momento em que a varredura passa pelo amigo e ele "acende". */
  delay: string;
}

interface Tick {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  major: boolean;
}

const CENTER = 120;
const OUTER_RADIUS = 112;
/** Duração de uma volta da varredura; precisa ser igual à animação em radar-hero.component.scss. */
export const SWEEP_MS = 2400;

/** Converte ângulo (graus, 0 = topo, sentido horário) e raio em coordenadas do SVG. */
export function polar(angle: number, radius: number): { x: number; y: number } {
  const rad = (angle * Math.PI) / 180;
  const round = (n: number) => Math.round(n * 10) / 10;
  return { x: round(CENTER + radius * Math.sin(rad)), y: round(CENTER - radius * Math.cos(rad)) };
}

function blip(initial: string, presence: Presence, angle: number, radius: number): Blip {
  return { initial, presence, ...polar(angle, radius), delay: `${(angle / 360) * SWEEP_MS}ms` };
}

/** Marcações de instrumento na borda: uma a cada 10°, maiores a cada 30°. */
function ticks(): Tick[] {
  return Array.from({ length: 36 }, (_, i) => {
    const angle = i * 10;
    const major = angle % 30 === 0;
    const inner = polar(angle, OUTER_RADIUS - (major ? 7 : 4));
    const outer = polar(angle, OUTER_RADIUS);
    return { x1: inner.x, y1: inner.y, x2: outer.x, y2: outer.y, major };
  });
}

/**
 * Radar decorativo da tela de login (DESIGN.md, "anel de radar"). Ao abrir a tela, a varredura
 * dá uma única volta e cada amigo acende quando ela passa por ele, com o anel na cor da
 * presença. Sem significado para leitores de tela, por isso fica escondido deles.
 */
@Component({
  selector: 'app-radar-hero',
  templateUrl: './radar-hero.component.html',
  styleUrl: './radar-hero.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RadarHeroComponent {
  protected readonly rings = [28, 56, 84, OUTER_RADIUS];
  protected readonly ticks = ticks();
  protected readonly blips: readonly Blip[] = [
    blip('A', 'playing', 40, 64),
    blip('L', 'online', 150, 88),
    blip('M', 'away', 250, 46),
  ];
}
