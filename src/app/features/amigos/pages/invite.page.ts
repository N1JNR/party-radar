import { ChangeDetectionStrategy, Component, computed, effect, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PoButtonModule, PoNotificationService } from '@po-ui/ng-components';

import { FriendsStore } from '../data/friends.store';
import { FoundPlayer, NOT_FOUND_MESSAGE, relationLabel, sendMessage } from '../domain/friends';
import { PersonRowComponent } from '../ui/person-row/person-row.component';

const FAILURE = 'Não foi possível concluir. Tente de novo.';

/**
 * Link de convite (spec 006, CA1): mostra quem convidou e a ação certa. Sem login, o guard leva ao
 * Discord e o `?next=` traz a pessoa de volta para cá (CA2).
 */
@Component({
  selector: 'app-invite-page',
  imports: [PoButtonModule, RouterLink, PersonRowComponent],
  providers: [FriendsStore],
  templateUrl: './invite.page.html',
  styleUrl: './invite.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InvitePage {
  protected readonly store = inject(FriendsStore);
  private readonly notification = inject(PoNotificationService);

  /** Da rota `/convite/:username`. */
  readonly username = input.required<string>();

  // Por `computed`: na suíte inteira, a constante ainda não existe quando os campos são criados.
  protected readonly notFound = computed(() => NOT_FOUND_MESSAGE);
  protected readonly player = computed(() => {
    const lookup = this.store.lookup();
    return lookup.status === 'found' ? lookup.player : null;
  });
  protected readonly status = computed(() => {
    const player = this.player();
    return player ? relationLabel(player.relation) : null;
  });

  constructor() {
    effect(() => void this.store.find(this.username()));
  }

  protected retry(): void {
    void this.store.find(this.username());
  }

  protected async send(player: FoundPlayer): Promise<void> {
    const result = await this.store.send(player);
    if (result === null) {
      this.notification.error(FAILURE);
      return;
    }
    const { success, text } = sendMessage(result, player.name);
    if (success) {
      this.notification.success(text);
    } else {
      this.notification.information(text);
    }
  }

  protected async accept(player: FoundPlayer): Promise<void> {
    if (await this.store.answer(player.id, true)) {
      this.notification.success(`Agora você e ${player.name} são amigos.`);
      await this.store.find(player.username);
    } else {
      this.notification.error(FAILURE);
    }
  }
}
