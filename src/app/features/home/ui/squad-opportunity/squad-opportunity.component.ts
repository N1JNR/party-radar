import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { PoButtonModule } from '@po-ui/ng-components';

import { PLATFORM_LABELS } from '../../domain/player-card';
import { SquadOpportunity } from '../../domain/squad-opportunity';

/** Destaque "3 do Squad da Sexta no Fortnite" com "Chamar o squad" (spec 002, CA12). */
@Component({
  selector: 'app-squad-opportunity',
  imports: [PoButtonModule],
  templateUrl: './squad-opportunity.component.html',
  styleUrl: './squad-opportunity.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SquadOpportunityComponent {
  readonly opportunity = input.required<SquadOpportunity>();
  readonly callSquad = output<SquadOpportunity>();

  protected readonly members = computed(() =>
    this.opportunity().members.map((member) => ({
      id: member.id,
      name: member.name,
      platform: PLATFORM_LABELS[member.platform],
    })),
  );
}
