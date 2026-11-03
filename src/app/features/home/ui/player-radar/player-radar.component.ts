import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';

import { FIRST_ACCESS_PHRASES, formatHours, gamesLabel } from '../../domain/player-card';
import {
  GameKind,
  PlayedGame,
  RADAR_CENTER,
  RADAR_RADIUS,
  RadarPeriod,
  gameBlocks,
  gameCount,
  kindShares,
  playerTitle,
  radarAxes,
  radarDescription,
  radarPolygon,
  totalHours,
} from '../../domain/player-radar';
import { GameBlocksComponent } from '../game-blocks/game-blocks.component';

/**
 * Radar do jogador (spec 004): a forma de cada um, com o período e os tipos de jogo. É a peça de
 * destaque da tela: a varredura passa uma vez ao abrir, e o resto fica calmo (DESIGN.md).
 */
@Component({
  selector: 'app-player-radar',
  imports: [GameBlocksComponent],
  templateUrl: './player-radar.component.html',
  styleUrl: './player-radar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlayerRadarComponent {
  readonly games = input.required<readonly PlayedGame[]>();

  protected readonly center = RADAR_CENTER;
  protected readonly rings = [0.25, 0.5, 0.75, 1].map((step) => step * RADAR_RADIUS);

  readonly period = signal<RadarPeriod>('all');
  private readonly chosenKind = signal<GameKind | null>(null);

  protected readonly shares = computed(() => kindShares(this.games(), this.period()));
  protected readonly visibleShares = computed(() =>
    this.shares()
      .filter((share) => share.hours > 0)
      .sort((a, b) => b.hours - a.hours),
  );
  /** O tipo aceso: o que a pessoa tocou ou, sem escolha válida no período, o que ela mais joga. */
  readonly selectedKind = computed<GameKind | null>(() => {
    const visible = this.visibleShares();
    const chosen = this.chosenKind();
    return visible.some((share) => share.kind === chosen) ? chosen : (visible[0]?.kind ?? null);
  });
  protected readonly blocks = computed(() => gameBlocks(this.games(), this.period()));
  protected readonly axes = computed(() => radarAxes(this.shares()));
  protected readonly polygon = computed(() => radarPolygon(this.axes()));
  protected readonly description = computed(() => radarDescription(this.shares()));
  protected readonly title = computed(() => playerTitle(this.shares()));
  protected readonly isEmpty = computed(() => this.visibleShares().length === 0);
  protected readonly caption = computed(
    () =>
      `${formatHours(totalHours(this.games(), this.period()))} em ${gamesLabel(gameCount(this.games(), this.period()))}`,
  );
  // Por `computed`, como no card: na suíte inteira, a constante ainda não existe quando os campos
  // da classe são criados.
  protected readonly emptyPhrase = computed(() => FIRST_ACCESS_PHRASES.hours);

  protected setPeriod(period: RadarPeriod): void {
    this.period.set(period);
  }

  protected pick(kind: GameKind): void {
    this.chosenKind.set(kind);
  }
}
