import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  afterNextRender,
  computed,
  input,
  output,
  viewChild,
} from '@angular/core';
import { PoButtonModule } from '@po-ui/ng-components';

import { PATENTES, PatenteProgress, remainingLabel } from '../../domain/patentes';
import { SeasonProgress, careerLabel, seasonHoursLabel, seasonLabel } from '../../domain/season';

type RankState = 'done' | 'current' | 'next';

/** Em texto, para não depender da cor; só a patente seguinte é "Próxima" (spec 005, CA18). */
function stateLabel(state: RankState, distance: number): string {
  if (state === 'done') {
    return 'Conquistada';
  }
  if (state === 'current') {
    return 'Patente atual';
  }
  return distance === 1 ? 'Próxima' : 'A conquistar';
}

/**
 * Trilha da patente (spec 004, CA12; spec 005): todas as patentes em ordem, a atual em destaque e o
 * progresso na temporada até a próxima, sempre também em texto.
 */
@Component({
  selector: 'app-rank-track',
  imports: [PoButtonModule],
  templateUrl: './rank-track.component.html',
  styleUrl: './rank-track.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RankTrackComponent {
  readonly progress = input.required<PatenteProgress>();
  /** A temporada em andamento; `null` sem Steam conectada (spec 005, CA16). */
  readonly season = input<SeasonProgress | null>(null);
  /** Horas totais na Steam, que não zeram com a temporada (spec 005, CA14). */
  readonly careerHours = input(0);
  /** Só com horas na temporada e com a Steam lida (spec 005, CA13). */
  readonly canShare = input(false);
  readonly sharing = input(false);
  readonly share = output<void>();

  private readonly scroller = viewChild.required<ElementRef<HTMLElement>>('scroller');

  protected readonly seasonText = computed(() => {
    const season = this.season();
    return season ? seasonLabel(season) : '';
  });
  protected readonly hoursText = computed(() => seasonHoursLabel(this.season()?.hours ?? 0));
  protected readonly career = computed(() => {
    const hours = this.careerHours();
    return hours > 0 ? careerLabel(hours) : null;
  });
  protected readonly remaining = computed(() => remainingLabel(this.progress()));
  protected readonly ranks = computed(() => {
    const progress = this.progress();
    const currentIndex = PATENTES.findIndex((patente) => patente.id === progress.current.id);
    return PATENTES.map((patente, index) => {
      const state: RankState =
        index < currentIndex ? 'done' : index === currentIndex ? 'current' : 'next';
      return {
        id: patente.id,
        name: patente.name,
        goal: patente.goal,
        pace: patente.pace,
        state,
        stateLabel: stateLabel(state, index - currentIndex),
        fill: state === 'done' ? 100 : state === 'current' ? progress.percent : 0,
        last: index === PATENTES.length - 1,
      };
    });
  });

  constructor() {
    // No celular a trilha rola no próprio espaço: abre com a patente atual no meio (CA12).
    afterNextRender(() => this.showCurrent());
  }

  private showCurrent(): void {
    const scroller = this.scroller().nativeElement;
    const current = scroller.querySelector<HTMLElement>('.track__item--current');
    if (current) {
      scroller.scrollLeft = current.offsetLeft - (scroller.clientWidth - current.offsetWidth) / 2;
    }
  }
}
