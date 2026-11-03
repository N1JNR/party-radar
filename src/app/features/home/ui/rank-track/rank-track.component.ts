import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  afterNextRender,
  computed,
  input,
  viewChild,
} from '@angular/core';

import { PATENTES, PatenteProgress, remainingLabel } from '../../domain/patentes';
import { formatHours } from '../../domain/player-card';

type RankState = 'done' | 'current' | 'next';

/**
 * Trilha da patente (spec 004, CA12): todas as patentes em ordem, a atual em destaque e o progresso
 * até a próxima, sempre também em texto. A spec 005 troca as regras, não este desenho.
 */
@Component({
  selector: 'app-rank-track',
  templateUrl: './rank-track.component.html',
  styleUrl: './rank-track.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RankTrackComponent {
  readonly progress = input.required<PatenteProgress>();
  /** Horas que contam para a patente. */
  readonly hours = input.required<number>();

  private readonly scroller = viewChild.required<ElementRef<HTMLElement>>('scroller');

  protected readonly hoursLabel = computed(() => formatHours(this.hours()));
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
        rule: patente.rule,
        state,
        stateLabel: { done: 'Conquistada', current: 'Patente atual', next: 'Próxima' }[state],
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
