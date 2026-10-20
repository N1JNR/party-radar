import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { PoButtonModule, PoIconModule } from '@po-ui/ng-components';

import {
  SteamStepState,
  StepStatus,
  stepStatusLabel,
  strengthenSteps,
} from '../../domain/strengthen';

/**
 * "Deixe seu card mais forte": o que já foi feito e o que falta (spec 002, CA7), com o botão
 * "Conectar Steam" enquanto a Steam não foi conectada (spec 003, CA1).
 */
@Component({
  selector: 'app-strengthen-card',
  imports: [PoButtonModule, PoIconModule],
  templateUrl: './strengthen-card.component.html',
  styleUrl: './strengthen-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StrengthenCardComponent {
  readonly steam = input.required<SteamStepState>();
  readonly friendsCount = input.required<number>();
  /** Copiar o link de convite. */
  readonly invite = output<void>();
  /** Ir para a Steam conectar a conta. */
  readonly connectSteam = output<void>();

  protected readonly steps = computed(() => strengthenSteps(this.steam(), this.friendsCount()));
  protected readonly needsSteam = computed(() => this.steam() === 'not-connected');
  protected readonly needsFriends = computed(() => this.friendsCount() === 0);

  protected statusLabel(status: StepStatus): string {
    return stepStatusLabel(status);
  }
}
