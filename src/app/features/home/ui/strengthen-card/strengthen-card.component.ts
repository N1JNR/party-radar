import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { PoButtonModule, PoIconModule } from '@po-ui/ng-components';

import { strengthenSteps } from '../../domain/strengthen';

/** "Deixe seu card mais forte": o que já foi feito e o que falta (spec 002, CA7). */
@Component({
  selector: 'app-strengthen-card',
  imports: [PoButtonModule, PoIconModule],
  templateUrl: './strengthen-card.component.html',
  styleUrl: './strengthen-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StrengthenCardComponent {
  readonly steamPublic = input.required<boolean>();
  readonly friendsCount = input.required<number>();
  /** Copiar o link de convite. */
  readonly invite = output<void>();

  protected readonly steps = computed(() =>
    strengthenSteps(this.steamPublic(), this.friendsCount()),
  );
  protected readonly needsFriends = computed(() => this.friendsCount() === 0);
}
