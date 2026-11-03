import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { PoAvatarModule, PoButtonModule } from '@po-ui/ng-components';

import {
  PlayerCard,
  playingLabel,
  steamNameLabel,
  updatedAgoLabel,
} from '../../domain/player-card';

/**
 * Quem é o jogador (spec 004): nome e foto do Discord, nome na Steam, o jogo aberto com o anel de
 * radar (spec 003, CA10), a última leitura quando ela está velha (CA15) e o botão de compartilhar.
 */
@Component({
  selector: 'app-player-header',
  imports: [PoAvatarModule, PoButtonModule],
  templateUrl: './player-header.component.html',
  styleUrl: './player-header.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlayerHeaderComponent {
  readonly card = input.required<PlayerCard>();
  /** Agora, para o "Atualizado há <tempo>". */
  readonly now = input(new Date());
  /** Sem horas não há o que compartilhar (spec 004, CA18). */
  readonly canShare = input(false);
  readonly sharing = input(false);
  readonly share = output<void>();

  protected readonly playing = computed(() => playingLabel(this.card().playingNow));
  protected readonly steamName = computed(() => steamNameLabel(this.card().steamName));
  protected readonly updatedAgo = computed(() =>
    updatedAgoLabel(this.card().updatedAt, this.now()),
  );
}
