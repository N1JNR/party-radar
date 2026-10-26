import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import {
  PoAvatarModule,
  PoButtonModule,
  PoIconModule,
  PoTagModule,
  PoTagType,
} from '@po-ui/ng-components';

import { PatenteProgress, remainingLabel } from '../../domain/patentes';
import {
  ESTIMATE_NOTE,
  FIRST_ACCESS_PHRASES,
  PlatformShare,
  PlayerCard,
  formatHours,
  gamesLabel,
  matchesLabel,
  playingLabel,
  steamNameLabel,
  updatedAgoLabel,
} from '../../domain/player-card';

/**
 * O card de jogador do mês (spec 002, CA4–CA7): cheio, com parceria provável ou "pobrinho" no
 * primeiro acesso, com frases no lugar dos dados que faltam.
 */
@Component({
  selector: 'app-player-card',
  imports: [PoAvatarModule, PoButtonModule, PoIconModule, PoTagModule],
  templateUrl: './player-card.component.html',
  styleUrl: './player-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlayerCardComponent {
  readonly card = input.required<PlayerCard>();
  readonly progress = input.required<PatenteProgress>();
  readonly platforms = input.required<readonly PlatformShare[]>();
  readonly firstAccess = input(false);
  /** Agora, para o "Atualizado há <tempo>" (spec 003, CA15). */
  readonly now = input(new Date());
  readonly seePatentes = output<void>();

  protected readonly phrases = computed(() => FIRST_ACCESS_PHRASES);
  // Por `computed`, como as frases: na suíte inteira, a constante ainda não existe quando os
  // campos da classe são criados.
  protected readonly estimateNote = computed(() => ESTIMATE_NOTE);
  protected readonly tagNeutral = PoTagType.Neutral;
  protected readonly playing = computed(() => playingLabel(this.card().playingNow));
  protected readonly steamName = computed(() => steamNameLabel(this.card().steamName));
  protected readonly updatedAgo = computed(() =>
    updatedAgoLabel(this.card().updatedAt, this.now()),
  );
  /** Horas do mês (spec 003, CA8); a patente usa as horas desde a conexão. */
  protected readonly hours = computed(() => formatHours(this.card().monthHours));
  protected readonly games = computed(() => gamesLabel(this.card().games));
  protected readonly gameOfMonthHours = computed(() =>
    formatHours(this.card().gameOfMonth?.hours ?? 0),
  );
  protected readonly matches = computed(() => matchesLabel(this.card().partner?.matches ?? 0));
  protected readonly remaining = computed(() => remainingLabel(this.progress()));
}
