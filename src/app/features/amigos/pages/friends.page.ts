import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  afterNextRender,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import {
  PoButtonModule,
  PoModalAction,
  PoModalComponent,
  PoModalModule,
  PoNotificationService,
} from '@po-ui/ng-components';

import { AuthStore } from '../../../core/auth/auth.store';
import { ClipboardService } from '../../../core/platform/clipboard.service';
import { ExternalNavigation } from '../../../core/platform/external-navigation';
import { playingLabel } from '../../home/domain/player-card';
import { FriendsStore } from '../data/friends.store';
import { FoundPlayer, Player, sendMessage } from '../domain/friends';
import { AddFriendComponent } from '../ui/add-friend/add-friend.component';
import { PersonRowComponent } from '../ui/person-row/person-row.component';

/** De quanto em quanto tempo a tela relê os amigos; o servidor lê a Steam a cada 5 minutos (CA13). */
export const REFRESH_EVERY_MS = 60_000;

const FAILURE = 'Não foi possível concluir. Tente de novo.';

interface Confirmation {
  kind: 'remove' | 'block';
  person: Player;
}

/** "Amigos" (spec 006): a lista, os pedidos, adicionar, remover e bloquear. */
@Component({
  selector: 'app-friends-page',
  imports: [PoButtonModule, PoModalModule, AddFriendComponent, PersonRowComponent],
  providers: [FriendsStore],
  templateUrl: './friends.page.html',
  styleUrl: './friends.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FriendsPage {
  protected readonly store = inject(FriendsStore);
  private readonly auth = inject(AuthStore);
  private readonly clipboard = inject(ClipboardService);
  private readonly navigation = inject(ExternalNavigation);
  private readonly notification = inject(PoNotificationService);
  private readonly modal = viewChild.required(PoModalComponent);

  protected readonly playingLabel = playingLabel;
  private readonly confirmation = signal<Confirmation | null>(null);
  protected readonly modalTitle = computed(() => {
    const confirmation = this.confirmation();
    if (!confirmation) {
      return '';
    }
    return `${confirmation.kind === 'remove' ? 'Remover' : 'Bloquear'} ${confirmation.person.name}?`;
  });
  protected readonly modalText = computed(() =>
    this.confirmation()?.kind === 'block'
      ? 'A amizade e os pedidos entre vocês acabam, e essa pessoa não consegue mais encontrar você. Ela não será avisada.'
      : 'A amizade acaba para os dois, e vocês param de ver o jogo aberto um do outro. Essa pessoa não será avisada.',
  );
  protected readonly confirmAction: PoModalAction = {
    label: 'Confirmar',
    danger: true,
    action: () => void this.confirm(),
  };
  protected readonly cancelAction: PoModalAction = {
    label: 'Cancelar',
    action: () => this.modal().close(),
  };

  constructor() {
    void this.store.load();
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      const timer = setInterval(() => void this.store.refresh(), REFRESH_EVERY_MS);
      destroyRef.onDestroy(() => clearInterval(timer));
    });
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

  protected async acceptFound(player: FoundPlayer): Promise<void> {
    await this.answer(player, true);
    this.store.clearLookup();
  }

  protected async answer(person: Player, accept: boolean): Promise<void> {
    if (!(await this.store.answer(person.id, accept))) {
      this.notification.error(FAILURE);
    } else if (accept) {
      this.notification.success(`Agora você e ${person.name} são amigos.`);
    } else {
      this.notification.information('Pedido recusado.');
    }
  }

  protected async cancel(person: Player): Promise<void> {
    if (!(await this.store.cancel(person.id))) {
      this.notification.error(FAILURE);
    }
  }

  protected async unblock(person: Player): Promise<void> {
    if (await this.store.unblock(person.id)) {
      this.notification.information(`Você desbloqueou ${person.name}.`);
    } else {
      this.notification.error(FAILURE);
    }
  }

  /** Remover e bloquear pedem confirmação (DESIGN.md). */
  protected ask(kind: Confirmation['kind'], person: Player): void {
    this.confirmation.set({ kind, person });
    this.modal().open();
  }

  private async confirm(): Promise<void> {
    const confirmation = this.confirmation();
    this.modal().close();
    if (!confirmation) {
      return;
    }
    const { kind, person } = confirmation;
    const done =
      kind === 'remove' ? await this.store.remove(person.id) : await this.store.block(person.id);
    if (done) {
      this.notification.information(
        kind === 'remove' ? `Você removeu ${person.name}.` : `Você bloqueou ${person.name}.`,
      );
    } else {
      this.notification.error(FAILURE);
    }
  }

  protected async copyInvite(): Promise<void> {
    const username = this.auth.user()?.username ?? '';
    const link = `${this.navigation.origin()}/convite/${username}`;
    if (await this.clipboard.copy(link)) {
      this.notification.success('Link de convite copiado.');
    } else {
      this.notification.information(`Não deu para copiar. Seu link de convite: ${link}`);
    }
  }
}
