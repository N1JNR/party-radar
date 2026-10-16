import { ChangeDetectionStrategy, Component } from '@angular/core';

/**
 * Radar decorativo da tela Entrar (DESIGN.md, "anel de radar"): três anéis finos, três
 * sinais nas cores de presença e uma única onda ao abrir a tela. Sem significado para
 * leitores de tela, por isso fica escondido deles.
 */
@Component({
  selector: 'app-radar-hero',
  templateUrl: './radar-hero.component.html',
  styleUrl: './radar-hero.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RadarHeroComponent {}
