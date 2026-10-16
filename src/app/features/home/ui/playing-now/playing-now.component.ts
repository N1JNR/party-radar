import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { PoAvatarModule, PoButtonModule } from '@po-ui/ng-components';

import { FriendPresence, playingForLabel } from '../../domain/friend-presence';
import { PLATFORM_LABELS } from '../../domain/player-card';

/** Amigos jogando agora, com jogo, tempo e plataforma; vazio com convite (spec 002, CA9). */
@Component({
  selector: 'app-playing-now',
  imports: [PoAvatarModule, PoButtonModule],
  templateUrl: './playing-now.component.html',
  styleUrl: './playing-now.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlayingNowComponent {
  readonly friends = input.required<readonly FriendPresence[]>();
  readonly now = input.required<Date>();
  /** Copiar o link de convite. */
  readonly invite = output<void>();

  protected readonly rows = computed(() =>
    this.friends().map((friend) => ({
      ...friend,
      since: playingForLabel(friend.startedAt, this.now()),
      platformLabel: PLATFORM_LABELS[friend.platform],
    })),
  );
}
