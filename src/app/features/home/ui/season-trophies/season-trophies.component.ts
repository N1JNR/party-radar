import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { PoButtonModule } from '@po-ui/ng-components';

import { SeasonTrophy, sortTrophies, trophyDetail, trophyLabel } from '../../domain/season';

/** Troféus de temporada (spec 005, CA12 e CA13): a patente final de cada temporada terminada. */
@Component({
  selector: 'app-season-trophies',
  imports: [PoButtonModule],
  templateUrl: './season-trophies.component.html',
  styleUrl: './season-trophies.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SeasonTrophiesComponent {
  readonly trophies = input.required<readonly SeasonTrophy[]>();
  readonly sharing = input(false);
  readonly share = output<SeasonTrophy>();

  protected readonly items = computed(() =>
    sortTrophies(this.trophies()).map((trophy) => ({
      trophy,
      label: trophyLabel(trophy),
      detail: trophyDetail(trophy),
    })),
  );
}
