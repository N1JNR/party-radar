import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { ESTIMATE_NOTE, PlayerCard, formatHours, gamesLabel } from '../../domain/player-card';
import { monthLabel } from '../../domain/player-radar';

/** As horas do mês atual, comparadas às do mês anterior (spec 004, CA11). */
@Component({
  selector: 'app-month-summary',
  templateUrl: './month-summary.component.html',
  styleUrl: './month-summary.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MonthSummaryComponent {
  readonly card = input.required<PlayerCard>();
  readonly previousHours = input(0);
  readonly previousIsEstimate = input(false);
  readonly now = input(new Date());

  protected readonly title = computed(() => `${monthLabel(this.now())} até agora`);
  protected readonly hours = computed(() => formatHours(this.card().monthHours));
  protected readonly detail = computed(() => {
    const { gameOfMonth, games } = this.card();
    if (games === 1 && gameOfMonth) {
      return `em ${gameOfMonth.name}`;
    }
    return games > 0 ? `em ${gamesLabel(games)}` : 'Nenhuma hora neste mês ainda.';
  });
  protected readonly gameOfMonth = computed(() => {
    const { gameOfMonth, games } = this.card();
    return games > 1 && gameOfMonth
      ? `Jogo do mês: ${gameOfMonth.name}, ${formatHours(gameOfMonth.hours)}`
      : null;
  });
  protected readonly previous = computed(() => {
    const hours = this.previousHours();
    if (!(hours > 0)) {
      return null;
    }
    const note = this.previousIsEstimate() ? ' (estimativa)' : '';
    return `${monthLabel(this.now(), -1)} fechou em ${formatHours(hours)}${note}.`;
  });
  protected readonly estimateNote = computed(() => (this.card().estimate ? ESTIMATE_NOTE : null));
}
